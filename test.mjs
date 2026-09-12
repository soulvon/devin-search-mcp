/**
 * 端到端测试脚本
 */

import { inspectDevinStatus } from "./src/detector.mjs";
import { executeWebSearch } from "./src/search.mjs";
import { executeWebFetch } from "./src/fetch.mjs";

async function main() {
  console.log("=== 1. 测试环境与登录诊断 ===");
  const status = inspectDevinStatus();
  console.log("可执行文件路径:", status.executable);
  console.log("是否已登录:", status.isLoggedIn);
  console.log("凭据文件:", status.credentialsPath);

  if (!status.executable || !status.isLoggedIn) {
    console.error("环境检测未通过，终止后续测试");
    process.exit(1);
  }

  console.log("\n=== 2. 测试联网搜索 (query: 'Vue 3.5 release highlights') ===");
  const searchStart = Date.now();
  const searchResult = await executeWebSearch({
    query: "Vue 3.5 release highlights",
    num_results: 3,
    detailed: false,
  });
  console.log(`搜索耗时: ${Date.now() - searchStart}ms`);
  console.log(`检索到结果数: ${searchResult.count}`);
  console.log("首条结果:", searchResult.results[0]);

  console.log("\n=== 3. 测试缓存有效性 ===");
  const cacheStart = Date.now();
  const cachedResult = await executeWebSearch({
    query: "Vue 3.5 release highlights",
    num_results: 3,
    detailed: false,
  });
  console.log(`缓存命中耗时: ${Date.now() - cacheStart}ms, 是否来自缓存: ${cachedResult.cached}`);

  console.log("\n=== 4. 测试网页抓取 (fetch: https://httpbin.org/json) ===");
  const fetchStart = Date.now();
  const fetchResult = await executeWebFetch({
    url: "https://httpbin.org/json",
    extractMode: "text",
  });
  console.log(`网页抓取耗时: ${Date.now() - fetchStart}ms`);
  console.log("抓取内容片段:", fetchResult.content.slice(0, 200));

  console.log("\n 测试全部顺利通过！");
}

main().catch((err) => {
  console.error("测试发生错误:", err);
  process.exit(1);
});
