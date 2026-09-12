/**
 * Devin 核心网页搜索模块
 * 深度解析、结构化提炼与重试机制 (对齐 fast-context-mcp 规范)
 */

import { execFile } from "node:child_process";
import { findDevinExecutable } from "./detector.mjs";
import { searchCache } from "./cache.mjs";
import { parseJsonWithRepair } from "./response-repair.mjs";

/**
 * 文本正则提取兜底逻辑
 */
function fallbackParseResults(text) {
  const results = [];
  const lines = text.split(/\r?\n/);
  let currentItem = null;

  for (const line of lines) {
    const urlMatch = line.match(/https?:\/\/[^\s)\]"'>]+/);
    if (urlMatch) {
      if (currentItem) results.push(currentItem);
      currentItem = {
        title: line.replace(urlMatch[0], "").replace(/^[-*#\d.\s]+/, "").trim() || "网页结果",
        url: urlMatch[0],
        snippet: "",
      };
    } else if (currentItem && line.trim()) {
      currentItem.snippet += (currentItem.snippet ? " " : "") + line.trim();
    }
  }
  if (currentItem) results.push(currentItem);
  return results;
}

/**
 * 执行带重试的 Devin 网页搜索
 */
export async function executeWebSearch({
  query,
  num_results = 5,
  detailed = false,
  timeoutMs = 35000,
  maxRetries = 1,
}) {
  if (!query || typeof query !== "string") {
    throw new Error("请提供有效的搜索关键词 (query)");
  }

  const startTime = Date.now();
  const cacheKey = searchCache.generateKey("web_search", query, { num_results, detailed });
  const cached = searchCache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      latencyMs: 0,
      cached: true,
    };
  }

  const devinExe = findDevinExecutable();
  if (!devinExe) {
    throw new Error("未检测到本地 Devin 安装，请确认已安装 Devin 或配置 DEVIN_PATH 环境变量。");
  }

  let prompt = "";
  if (!detailed) {
    prompt = `请调用内置的 web_search 工具搜索 "${query}"（返回约 ${num_results} 条）。不要输出任何多余寒暄、说明或额外文本，只输出一个标准的 JSON 数组，每个元素包含 "title", "url", "snippet"。`;
  } else {
    prompt = `请调用内置的 web_search 工具深度搜索 "${query}"。请输出：1. 检索到的核心网页列表（包含标题、完整 URL、核心摘录）；2. 针对该查询的综合结论分析与技术要点提炼。以清晰的 Markdown 格式呈现。`;
  }

  const runAttempt = () =>
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
              reject(new Error(`搜索超时 (超过 ${timeoutMs / 1000}s)`));
            } else {
              reject(new Error(`执行搜索失败: ${error.message}\n${stderr || ""}`));
            }
            return;
          }
          resolve(stdout.trim());
        }
      );
    });

  let rawOutput = "";
  let lastErr = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      rawOutput = await runAttempt();
      break;
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  if (!rawOutput && lastErr) {
    throw lastErr;
  }

  let structuredResults = [];
  let summary = "";

  if (!detailed) {
    const parsed = parseJsonWithRepair(rawOutput);
    if (Array.isArray(parsed) && parsed.length > 0) {
      structuredResults = parsed.slice(0, num_results).map((item) => ({
        title: item.title || item.name || "网页结果",
        url: item.url || item.link || "",
        snippet: item.snippet || item.description || item.summary || "",
      }));
    } else {
      structuredResults = fallbackParseResults(rawOutput).slice(0, num_results);
    }
  } else {
    summary = rawOutput;
    structuredResults = fallbackParseResults(rawOutput).slice(0, num_results);
  }

  const latencyMs = Date.now() - startTime;
  const resultPayload = {
    query,
    count: structuredResults.length,
    results: structuredResults,
    summary: summary || undefined,
    latencyMs,
    config: `query="${query}" num_results=${num_results} detailed=${detailed}`,
    cached: false,
  };

  searchCache.set(cacheKey, resultPayload);
  return resultPayload;
}
