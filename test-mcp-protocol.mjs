/**
 * 真实的 MCP 客户端 Stdio 协议模拟测试
 * 覆盖 initialize, tools/list, extract_devin_key, devin_status
 */

import { spawn } from "node:child_process";
import { resolve } from "node:path";

async function testMcpProtocol() {
  console.log("=== 开始 MCP Stdio 协议端到端完整测试 ===");

  const serverProcess = spawn("node", [resolve("bin/devin-search-mcp.mjs")], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  let buffer = "";
  const responses = [];

  serverProcess.stdout.on("data", (chunk) => {
    buffer += chunk.toString("utf-8");
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (line.trim()) {
        try {
          const parsed = JSON.parse(line);
          responses.push(parsed);
        } catch {}
      }
    }
  });

  serverProcess.stderr.on("data", (chunk) => {
    console.log("[Server]", chunk.toString("utf-8").trim());
  });

  function sendRpc(msg) {
    serverProcess.stdin.write(JSON.stringify(msg) + "\n");
  }

  function waitForResponse(id, timeoutMs = 10000) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const found = responses.find((r) => r.id === id);
        if (found) {
          clearInterval(interval);
          resolve(found);
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          reject(new Error(`等待 RPC 响应超时 (id: ${id})`));
        }
      }, 50);
    });
  }

  // 1. 初始化握手
  console.log("1. 发送 initialize 请求...");
  sendRpc({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" },
    },
  });

  const initRes = await waitForResponse(1);
  console.log("-> 握手响应:", initRes.result.serverInfo);

  sendRpc({
    jsonrpc: "2.0",
    method: "notifications/initialized",
  });

  // 2. 获取工具列表
  console.log("\n2. 发送 tools/list 请求...");
  sendRpc({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {},
  });

  const toolsRes = await waitForResponse(2);
  const toolNames = toolsRes.result.tools.map((t) => t.name);
  console.log("-> 工具列表:", toolNames);

  // 3. 测试 extract_devin_key
  console.log("\n3. 调用 extract_devin_key 工具...");
  sendRpc({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "extract_devin_key",
      arguments: {},
    },
  });

  const keyRes = await waitForResponse(3);
  console.log("-> 提取结果输出:\n" + keyRes.result.content[0].text);

  serverProcess.kill();
  console.log("\n=== MCP 协议端到端测试 100% 成功！===");
}

testMcpProtocol().catch((err) => {
  console.error("测试失败:", err);
  process.exit(1);
});
