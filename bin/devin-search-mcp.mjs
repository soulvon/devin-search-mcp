#!/usr/bin/env node

/**
 * devin-search-mcp 命令行入口
 */

import { runServer } from "../src/index.mjs";

runServer().catch((error) => {
  console.error("启动 devin-search-mcp 时发生严重错误:", error);
  process.exit(1);
});
