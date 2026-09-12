import { readFileSync, writeFileSync } from "node:fs";

const exePath = "E:/Program/devin/resources/app/extensions/windsurf/devin/bin/devin.exe";
const buf = readFileSync(exePath);
const text = buf.toString("latin1");

// 1. 提取所有可能的 URL / API 路径
const urlCandidates = new Set();
const urlRegex = /https?:\/\/[a-zA-Z0-9._\-\/]{5,80}/g;
let m;
while ((m = urlRegex.exec(text)) !== null) {
  urlCandidates.add(m[0]);
}

console.log("=== 提取到的 URL 候选 (前 60 个) ===");
console.log([...urlCandidates].slice(0, 60).join("\n"));

// 2. 提取 Search 相关标识符
const searchIds = new Set();
const searchRegex = /[a-zA-Z0-9_]*[Ss]earch[a-zA-Z0-9_]*/g;
while ((m = searchRegex.exec(text)) !== null) {
  if (m[0].length > 6) searchIds.add(m[0]);
}
console.log("\n=== Search 相关标识符 ===");
console.log([...searchIds].slice(0, 50).join("\n"));

// 3. 提取 Get 开头的 RPC 方法
const rpcIds = new Set();
const rpcRegex = /\bGet[A-Z][a-zA-Z0-9]{4,30}\b/g;
while ((m = rpcRegex.exec(text)) !== null) {
  rpcIds.add(m[0]);
}
console.log("\n=== Get 开头的 RPC 方法候选 ===");
console.log([...rpcIds].slice(0, 40).join("\n"));
