/**
 * Devin Search MCP Server
 * 遵循 Model Context Protocol 标准实现 (对齐 fast-context-mcp 规范)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { inspectDevinStatus } from "./detector.mjs";
import { extractDevinKey } from "./extract-key.mjs";
import { executeWebSearch } from "./search.mjs";
import { executeWebFetch } from "./fetch.mjs";

export function createDevinSearchServer() {
  const server = new Server(
    {
      name: "devin-search-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "devin_web_search",
          description:
            "AI 驱动的实时网页搜索工具 (基于 Devin 联网引擎)。通过自然语言检索全网技术文档、最新版本特性、解决方案和开源生态，输出包含标题、URL及核心摘录的结构化结果。\n\n参数提示:\n- query: 搜索词或自然语言问题 (必填)\n- num_results: 返回条数 (默认 5)\n- detailed: 设置为 true 可额外附带深度技术见解与综合总结",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "自然语言搜索查询 (例如: 'Next.js 15 features', 'Vue 3.5 reactive props')",
              },
              num_results: {
                type: "integer",
                minimum: 1,
                maximum: 15,
                default: 5,
                description: "期望返回的结果数量 (默认 5，建议 3-10)",
              },
              max_results: {
                type: "integer",
                description: "num_results 的兼容别名",
              },
              detailed: {
                type: "boolean",
                default: false,
                description: "是否返回深度 AI 综合总结与结论分析",
              },
            },
            required: ["query"],
          },
        },
        {
          name: "devin_web_fetch",
          description:
            "抓取并深度阅读指定网页的正文。自动过滤广告、导航、页脚与杂乱代码，支持输出纯正文或规范的 Markdown 格式。",
          inputSchema: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "目标网页的完整 URL (必须以 http:// 或 https:// 开头)",
              },
              extract_mode: {
                type: "string",
                enum: ["markdown", "text", "summary"],
                default: "markdown",
                description: "正文提取格式: 'markdown' (结构化文档，默认), 'text' (纯文本), 'summary' (核心要点摘要)",
              },
            },
            required: ["url"],
          },
        },
        {
          name: "extract_devin_key",
          description:
            "从本地安装中自动提取 Devin / Windsurf API Key (对齐 fast-context-mcp 的 extract_windsurf_key)。自动检测操作系统，读取 state.vscdb 或 credentials.toml 并输出有效凭据。",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "devin_status",
          description: "诊断工具: 检测本地 Devin 安装路径、登录身份与可用性状态。",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === "devin_web_search") {
        const query = args?.query;
        const numResults = args?.num_results ?? args?.max_results ?? 5;
        const detailed = args?.detailed ?? false;

        const result = await executeWebSearch({
          query,
          num_results: numResults,
          detailed,
        });

        const lines = [
          `[config] ${result.config} (耗时: ${result.latencyMs}ms, 缓存命中: ${result.cached})`,
          "",
        ];

        if (detailed && result.summary) {
          lines.push(result.summary);
        } else {
          lines.push(JSON.stringify(result.results, null, 2));
        }

        return {
          content: [
            {
              type: "text",
              text: lines.join("\n"),
            },
          ],
        };
      }

      if (name === "devin_web_fetch") {
        const url = args?.url;
        const extractMode = args?.extract_mode ?? "markdown";

        const result = await executeWebFetch({
          url,
          extractMode,
        });

        return {
          content: [
            {
              type: "text",
              text: result.content,
            },
          ],
        };
      }

      if (name === "extract_devin_key") {
        const res = await extractDevinKey();
        if (!res.api_key) {
          return {
            content: [
              {
                type: "text",
                text: "未在本地找到有效的 Devin / Windsurf API Key。请确认 Devin Desktop 处于登录状态。",
              },
            ],
          };
        }

        const text = [
          "Devin API Key extracted successfully",
          "",
          `  Key: ${res.api_key.slice(0, 25)}...${res.api_key.slice(-15)}`,
          `  Length: ${res.length}`,
          `  Source: ${res.source}`,
          `  App: ${res.app}`,
          "",
          "Usage:",
          `  export DEVIN_API_KEY="${res.api_key}"`,
        ].join("\n");

        return {
          content: [{ type: "text", text }],
        };
      }

      if (name === "devin_status") {
        const status = inspectDevinStatus();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      throw new Error(`未知的工具名称: ${name}`);
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `[devin-search-mcp 出错] ${error.message}`,
          },
        ],
      };
    }
  });

  return server;
}

export async function runServer() {
  const server = createDevinSearchServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Devin Search MCP 服务器已成功启动 (stdio)");
}
