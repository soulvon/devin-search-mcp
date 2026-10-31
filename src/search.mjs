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
      "❌ 未检测到本地 Devin 登录凭证。\n\n" +
        "本工具依赖本机 Devin Desktop 的登录凭证（免费）：\n" +
        "  1. 下载安装 Devin Desktop → https://devin.ai/download\n" +
        "  2. 注册/登录一次（免费账号即可）\n" +
        "  3. 重启本 MCP 服务，凭证将自动提取（无需任何配置）\n\n" +
        "已扫描的凭证位置：\n" +
        "  - ~/.devin/credentials.toml 及各平台对应路径\n" +
        "  - Devin / Windsurf globalStorage (state.vscdb)\n\n" +
        "已安装仍报错？调用 extract_devin_key 工具查看详细诊断。"
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
