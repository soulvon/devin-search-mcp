/**
 * 轻量化网页正文抓取模块
 * 本地直接 HTTP 抓取并做 HTML 到 Markdown 的正则清洗，零重型依赖
 */

import { searchCache } from "./cache.mjs";

/**
 * HTML 到 Markdown 极简清洗
 */
function htmlToMarkdown(html) {
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  text = text
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n* $1")
    .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, "\n```\n$1\n```\n")
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();

  return text;
}

/**
 * 抓取指定 URL 的网页正文
 */
export async function executeWebFetch({ url, extractMode = "markdown", timeoutMs = 25000 }) {
  if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    throw new Error("请提供有效的 HTTP/HTTPS 网页 URL");
  }

  const cacheKey = searchCache.generateKey("native_web_fetch", url, { extractMode });
  const cached = searchCache.get(cacheKey);
  if (cached) return { ...cached, cached: true };

  const startTime = Date.now();

  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!resp.ok) {
    throw new Error(`网页抓取失败: HTTP ${resp.status} ${resp.statusText}`);
  }

  const html = await resp.text();
  let content = htmlToMarkdown(html);

  if (extractMode === "text") {
    content = content.replace(/[#*`\[\]()]/g, "").replace(/\n{2,}/g, "\n").trim();
  }

  const resultPayload = {
    url,
    extractMode,
    content,
    latencyMs: Date.now() - startTime,
    cached: false,
  };

  searchCache.set(cacheKey, resultPayload);
  return resultPayload;
}
