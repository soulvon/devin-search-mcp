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
    throw new Error("未检测到本地 Devin 登录凭证，请先安装并登录 Devin Desktop。");
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
