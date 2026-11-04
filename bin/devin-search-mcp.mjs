#!/usr/bin/env node

/**
 * devin-search-mcp 命令行入口
 * 支持一键 OAuth 免装客户端登录与标准 MCP 服务启动
 */

import { runServer } from "../src/index.mjs";
import { loginOAuth } from "../src/oauth.mjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf-8"));
    return pkg.version || "2.0.1";
  } catch {
    return "2.0.1";
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("-v") || args.includes("--version")) {
    console.log(`v${getVersion()}`);
    process.exit(0);
  }

  if (args.includes("-h") || args.includes("--help")) {
    console.log(`
Devin Search MCP (v${getVersion()})
Blazing-fast real-time web search & clean webpage fetch as a standard MCP

用法 / Usage:
  devin-search-mcp                以 stdio 模式启动 MCP 服务 (用于 Cursor / Claude 等)
  devin-search-mcp login          免装客户端，浏览器一键 OAuth 登录并保存免费凭证
  devin-search-mcp auth           与 login 相同

选项 / Options:
  -v, --version                   显示版本号
  -h, --help                      显示帮助信息
`);
    process.exit(0);
  }

  if (args.includes("login") || args.includes("auth")) {
    await loginOAuth();
    process.exit(0);
  }

  // 默认启动 MCP stdio 服务
  await runServer();
}

main().catch((error) => {
  console.error("执行 devin-search-mcp 时发生错误:", error);
  process.exit(1);
});
