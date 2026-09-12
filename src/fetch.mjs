/**
 * Devin 网页抓取与阅读模块
 * 严格调用 Devin CLI 的 webfetch 官方能力提取正文
 * 遵循 Debug-First 准则：仅处理 retryable 官方重试，绝不引入隐式回退或静默降级代码，彻底暴露底层真实异常
 */

import { execFile } from "node:child_process";
import { findDevinExecutable } from "./detector.mjs";
import { searchCache } from "./cache.mjs";

/**
 * 抓取指定 URL 的网页内容
 * @param {Object} options
 * @param {string} options.url - 目标网页 URL
 * @param {"markdown"|"text"|"summary"} [options.extractMode="markdown"] - 提取格式
 * @param {number} [options.timeoutMs=60000] - 超时毫秒数
 * @param {number} [options.maxRetries=1] - retryable 瞬时网络错误重试次数
 */
export async function executeWebFetch({
  url,
  extractMode = "markdown",
  timeoutMs = parseInt(process.env.DEVIN_TIMEOUT_MS || "60000", 10),
  maxRetries = 1,
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
  if (!devinExe) {
    throw new Error("未检测到本地 Devin 安装，请确认已安装 Devin 或配置 DEVIN_PATH 环境变量。");
  }

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
              reject(new Error(error.message + (stderr ? `\n${stderr}` : "")));
            }
            return;
          }
          resolve(stdout.trim());
        }
      );
    });

  let output = "";
  let lastErr = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      output = await runDevinAttempt();
      if (output) break;
    } catch (err) {
      lastErr = err;
      // 仅当官方返回 retryable: true 或连接瞬时重置时做退避重试
      if (/retryable|ETIMEDOUT|ECONNRESET/i.test(err.message)) {
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
      }
      // 非 retryable 错误不盲目重试，立即向上抛出
      throw err;
    }
  }

  // 彻底暴露问题：如果没有产出，坚决抛出真实异常，严禁任何伪造成功或隐式本地降级
  if (!output) {
    throw lastErr || new Error(`Devin 抓取网页未返回任何内容: ${url}`);
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
