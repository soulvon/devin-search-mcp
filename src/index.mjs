/**
 * Devin Search MCP Server (原生极速架构版)
 * 遵循 Model Context Protocol，零本地重型进程，对齐 fast-context-mcp 设计
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { extractDevinKey } from "./extract-key.mjs";
import { executeWebSearch } from "./search.mjs";
import { executeWebFetch } from "./fetch.mjs";

export function createDevinSearchServer() {
  const server = new Server(
    { name: "devin-search-mcp", version: "2.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "devin_web_search",
        description:
          "极速全网实时检索 (直连 Devin 官方网关)。用自然语言查最新技术文档、库版本特性、报错与开源方案，亚秒级返回结构化标题、网址与摘要。",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "搜索关键词或自然语言问题" },
            num_results: { type: "integer", minimum: 1, maximum: 15, default: 5, description: "返回结果条数 (默认 5)" },
            detailed: { type: "boolean", default: false, description: "是否附带深度综合总结" },
          },
          required: ["query"],
        },
      },
      {
        name: "devin_web_fetch",
        description: "轻量抓取指定网页的正文内容，自动剔除导航、广告与脚本，输出整洁的 Markdown 或纯文本。",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "目标网页完整 URL (http/https)" },
            extract_mode: { type: "string", enum: ["markdown", "text", "summary"], default: "markdown", description: "输出格式" },
          },
          required: ["url"],
        },
      },
      {
        name: "extract_devin_key",
        description: "自动提取本地 Devin / Windsurf 登录凭证 (对齐 fast-context-mcp 的 extract_windsurf_key)。",
        inputSchema: { type: "object", properties: {} },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      if (name === "devin_web_search") {
        const res = await executeWebSearch({
          query: args?.query,
          num_results: args?.num_results ?? 5,
          detailed: args?.detailed ?? false,
        });

        const lines = [`[config] query="${res.query}" 耗时=${res.latencyMs}ms 缓存=${res.cached}`, ""];
        lines.push(JSON.stringify(res.results, null, 2));

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      if (name === "devin_web_fetch") {
        const res = await executeWebFetch({
          url: args?.url,
          extractMode: args?.extract_mode ?? "markdown",
        });
        return { content: [{ type: "text", text: res.content }] };
      }

      if (name === "extract_devin_key") {
        const r = await extractDevinKey();
        if (!r.api_key) {
          return { content: [{ type: "text", text: "未在本地找到有效的 Devin 凭证，请确认 Devin Desktop 已登录。" }] };
        }
        return {
          content: [{
            type: "text",
            text: [
              "Devin API Key extracted successfully",
              "",
              `  Key: ${r.api_key.slice(0, 25)}...${r.api_key.slice(-15)}`,
              `  Length: ${r.length}`,
              `  Source: ${r.source}`,
              `  App: ${r.app}`,
              "",
              `Usage:`,
              `  export DEVIN_API_KEY="${r.api_key}"`,
            ].join("\n"),
          }],
        };
      }

      throw new Error(`未知的工具名称: ${name}`);
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `[devin-search-mcp 出错] ${error.message}` }],
      };
    }
  });

  return server;
}

export async function runServer() {
  const server = createDevinSearchServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Devin Search MCP 原生极速版已启动 (stdio)");
}
