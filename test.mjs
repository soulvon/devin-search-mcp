/**
 * 原生极速架构端到端自测
 */

import { extractDevinKey } from "./src/extract-key.mjs";
import { executeWebSearch } from "./src/search.mjs";
import { executeWebFetch } from "./src/fetch.mjs";

async function main() {
  console.log("=== 1. 检测本地凭证 ===");
  const keyRes = await extractDevinKey();
  console.log(keyRes.api_key ? `凭证提取成功 (来源: ${keyRes.source})` : "凭证提取失败");

  console.log("\n=== 2. 原生极速检索测试 ===");
  const t0 = Date.now();
  const search = await executeWebSearch({ query: "Next.js 15 破坏性变更", num_results: 3 });
  console.log(`搜索耗时: ${Date.now() - t0}ms，命中 ${search.count} 条`);
  console.log(JSON.stringify(search.results, null, 2).slice(0, 1200));

  console.log("\n=== 3. 缓存命中测试 ===");
  const t1 = Date.now();
  const cached = await executeWebSearch({ query: "Next.js 15 破坏性变更", num_results: 3 });
  console.log(`缓存耗时: ${Date.now() - t1}ms，是否命中缓存: ${cached.cached}`);

  console.log("\n=== 4. 轻量网页抓取测试 ===");
  const t2 = Date.now();
  const fetchRes = await executeWebFetch({ url: "https://tailwindcss.com/blog/tailwindcss-v4", extractMode: "markdown" });
  console.log(`抓取耗时: ${Date.now() - t2}ms，内容长度: ${fetchRes.content.length}`);
  console.log("片段:", fetchRes.content.slice(0, 300));

  console.log("\n=== 全部测试通过 ===");
}

main().catch((e) => {
  console.error("测试失败:", e);
  process.exit(1);
});
