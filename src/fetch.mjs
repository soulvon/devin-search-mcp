/**
 * Devin 网页抓取与阅读模块
 * 调用 Devin CLI 的 webfetch 工具提取指定网页的清洁正文
 * 支持 retryable 错误自动重试与原生网络抓取兜底
 */

import { execFile } from "node:child_process";
import { findDevinExecutable } from "./detector.mjs";
import { searchCache } from "./cache.mjs";

/**
 * 极简 HTML 清洗工具 (原生兜底用)
 */
function cleanHtmlToMarkdown(html) {
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "");

  // 简易转换为 Markdown
  text = text
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n* $1")
    .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, "\n```\n$1\n```\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();

  return text;
}

/**
 * 原生 Fetch 极速抓取兜底
 */
async function nativeFetchFallback(url) {
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
  }

  const html = await resp.text();
  return cleanHtmlToMarkdown(html);
}

/**
 * 抓取指定 URL 的网页内容
 * @param {Object} options
 * @param {string} options.url - 目标网页 URL
 * @param {"markdown"|"text"|"summary"} [options.extractMode="markdown"] - 提取格式
 * @param {number} [options.timeoutMs=60000] - 超时毫秒数
 * @param {number} [options.maxRetries=2] - 重试次数
 */
export async function executeWebFetch({
  url,
  extractMode = "markdown",
  timeoutMs = parseInt(process.env.DEVIN_TIMEOUT_MS || "60000", 10),
  maxRetries = 2,
}) {
  if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    throw new Error("请提供有效的 HTTP/HTTPS 网页 URL");
  }

  const cacheKey = searchCache.generateKey("web_fetch", url, { extractMode });
  const cached = searchCache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  const devinExe = findDevinExecutable();

  let prompt = "";
  if (extractMode === "summary") {
    prompt = `请使用 webfetch 工具读取 ${url} 的内容，并提供一份精准详实的核心内容提炼与关键要点总结。`;
  } else if (extractMode === "text") {
    prompt = `请使用 webfetch 工具读取 ${url} 的内容，去除网页导航、广告和页脚，直接输出主要正文纯文本。`;
  } else {
    prompt = `请使用 webfetch 工具读取 ${url} 的内容，并将正文内容转换为整洁、规范的 Markdown 格式输出。不要添加任何额外多余的寒暄。`;
  }

  const runDevinAttempt = () =>
    new Promise((resolve, reject) => {
      execFile(
        devinExe,
        ["--permission-mode", "dangerous", "--respect-workspace-trust", "false", "-p", prompt],
        {
          timeout: timeoutMs,
          maxBuffer: 10 * 1024 * 1024,
          encoding: "utf-8",
          env: { ...process.env, DEVIN_PERMISSION_MODE: "dangerous" },
        },
        (error, stdout, stderr) => {
          if (error) {
            if (error.killed) {
              reject(new Error(`网页读取超时（超过 ${timeoutMs / 1000} 秒）: ${url}`));
            } else {
              reject(new Error(`${error.message}\n${stderr || ""}`));
            }
            return;
          }
          resolve(stdout.trim());
        }
      );
    });

  let output = "";
  let lastErr = null;

  if (devinExe) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        output = await runDevinAttempt();
        if (output) break;
      } catch (err) {
        lastErr = err;
        // 如果是可重试的频控错误，进行指数退避
        if (/resource_exhausted|retryable|ETIMEDOUT/i.test(err.message)) {
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
            continue;
          }
        }
        break;
      }
    }
  }

  // 如果 Devin 暂时频控或遇到网络故障，自动无缝降级走本地原生 fetch 提取
  if (!output) {
    try {
      output = await nativeFetchFallback(url);
    } catch (fallbackErr) {
      throw new Error(`网页抓取失败: ${lastErr?.message || fallbackErr.message}`);
    }
  }

  const resultPayload = {
    url,
    extractMode,
    content: output,
    cached: false,
  };

  searchCache.set(cacheKey, resultPayload);
  return resultPayload;
}
