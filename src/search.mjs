/**
 * Devin 全网实时检索模块 (原生极速版)
 * 不启动任何本地客户端进程，不经过大模型推理
 */

import { extractDevinKey } from "./extract-key.mjs";
import { getCachedJwt, nativeWebSearch } from "./native-api.mjs";
import { searchCache } from "./cache.mjs";

/**
 * 执行原生极速检索
 */
export async function executeWebSearch({ query, num_results = 5, detailed = false }) {
  if (!query || typeof query !== "string") {
    throw new Error("请提供有效的搜索关键词 (query)");
  }

  const startTime = Date.now();
  const cacheKey = searchCache.generateKey("native_web_search", query, { num_results, detailed });
  const cached = searchCache.get(cacheKey);
  if (cached) {
    return { ...cached, latencyMs: 0, cached: true };
  }

  const { api_key } = await extractDevinKey();
  if (!api_key) {
    throw new Error(
      "❌ 未检测到 Devin / Windsurf 登录凭证。\n\n" +
        "💡 本工具完全免费，无需安装任何桌面客户端，可通过以下方式之一授权使用：\n\n" +
        "  方式 1（推荐 · 免装客户端一键登录）：\n" +
        "    在终端运行命令：\n" +
        "      npx devin-search-mcp login\n" +
        "    （自动调起浏览器完成 Google / GitHub 一键登录，授权后自动保存凭证）\n\n" +
        "  方式 2（环境变量直连）：\n" +
        "    在 MCP 配置或系统环境变量中设置：\n" +
        "      DEVIN_API_KEY=\"你的API_Key\"\n\n" +
        "  方式 3（已有客户端无感读取）：\n" +
        "    若本机已安装 Devin Desktop 或 Windsurf，登录后凭证将自动提取，无需配置。"
    );
  }

  const jwt = await getCachedJwt(api_key);
  const rawResults = await nativeWebSearch(api_key, jwt, query);

  const structuredResults = rawResults.slice(0, num_results).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.snippet ? r.snippet.replace(/\n+/g, " ").slice(0, 500) : "",
  }));

  const latencyMs = Date.now() - startTime;
  const resultPayload = {
    query,
    count: structuredResults.length,
    results: structuredResults,
    latencyMs,
    cached: false,
  };

  searchCache.set(cacheKey, resultPayload);
  return resultPayload;
}
