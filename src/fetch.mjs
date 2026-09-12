/**
 * Devin 网页抓取与阅读模块
 * 调用 Devin CLI 的 webfetch 工具提取指定网页的清洁正文
 */

import { execFile } from "node:child_process";
import { findDevinExecutable } from "./detector.mjs";
import { searchCache } from "./cache.mjs";

/**
 * 抓取指定 URL 的网页内容
 * @param {Object} options
 * @param {string} options.url - 目标网页 URL
 * @param {"markdown"|"text"|"summary"} [options.extractMode="markdown"] - 提取格式
 * @param {number} [options.timeoutMs=35000] - 超时毫秒数
 */
export async function executeWebFetch({ url, extractMode = "markdown", timeoutMs = 35000 }) {
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
    throw new Error("未找到 Devin 可执行文件，请确认已安装 Devin 或设置 DEVIN_PATH 环境变量。");
  }

  let prompt = "";
  if (extractMode === "summary") {
    prompt = `请使用 webfetch 工具读取 ${url} 的内容，并提供一份精准详实的核心内容提炼与关键要点总结。`;
  } else if (extractMode === "text") {
    prompt = `请使用 webfetch 工具读取 ${url} 的内容，去除网页导航、广告和页脚，直接输出主要正文纯文本。`;
  } else {
    prompt = `请使用 webfetch 工具读取 ${url} 的内容，并将正文内容转换为整洁、规范的 Markdown 格式输出。不要添加任何额外多余的寒暄。`;
  }

  const output = await new Promise((resolve, reject) => {
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
            reject(new Error(`网页读取失败: ${error.message}\n${stderr || ""}`));
          }
          return;
        }
        resolve(stdout.trim());
      }
    );
  });

  const resultPayload = {
    url,
    extractMode,
    content: output,
    cached: false,
  };

  searchCache.set(cacheKey, resultPayload);
  return resultPayload;
}
