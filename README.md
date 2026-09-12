# Devin Search MCP

[![npm version](https://img.shields.io/npm/v/devin-search-mcp.svg)](https://www.npmjs.com/package/devin-search-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

基于 Devin 原生引擎的 AI 联网网页搜索与深度抓取 MCP (Model Context Protocol) 插件。

项目整体设计与工程规范深度对齐 `@sammysnake/fast-context-mcp`，支持跨平台本地凭证自动提取、健壮的模型输出修复、全网实时搜索与智能正文清洗。

---

## 特性亮点

* **全网实时搜索 (`devin_web_search`)**：直接使用 Devin 官方针对开发者深度优化的搜索网关，获取最新的开源项目、技术文档、版本发布与报错解决方案。
* **本地凭证自动提取 (`extract_devin_key`)**：深度模仿 `fast-context-mcp`，依赖 `sql.js`（纯 WASM/JS）自动扫描 `state.vscdb` 和 `credentials.toml`，一键导出有效凭据。
* **深度网页正文抓取 (`devin_web_fetch`)**：自动剔除网页广告、导航、页脚等噪声，返回整洁的 Markdown 格式。
* **响应自动修复与容错 (`response-repair`)**：内置括号深度平衡与畸形 JSON 自动修复算法，避免大模型输出解析崩溃。
* **智能缓存加速 (`cache`)**：内置基于 MD5 与 TTL 的轻量缓存，相同搜索毫秒级返回，节约配额并加速响应。
* **CI/CD 全自动发布**：配置了 GitHub Actions 自动化发布工作流，开箱即支持一键发包到 npm。

---

## 提供的 MCP 工具

| 工具名称 | 功能描述 | 关键参数 |
| :--- | :--- | :--- |
| `devin_web_search` | 执行全网实时搜索，返回结构化网页列表及摘要 | `query` (必需), `num_results`, `detailed` |
| `devin_web_fetch` | 抓取并阅读指定网址的深度清洁正文 | `url` (必需), `extract_mode` (`markdown`/`text`/`summary`) |
| `extract_devin_key` | 跨平台自动提取本地 Devin / Windsurf API Key | 无 |
| `devin_status` | 诊断检测本地 Devin 安装路径、登录身份与可用性状态 | 无 |

---

## 快速配置使用

在任意 AI 客户端（如 CodeBuddy、Claude Desktop、Cursor 等）的 MCP 配置文件中添加：

### 本地路径运行方式

```json
{
  "mcpServers": {
    "devin-search": {
      "command": "node",
      "args": [
        "E:\\project\\devin-search-mcp\\bin\\devin-search-mcp.mjs"
      ]
    }
  }
}
```

### npm 发布后的运行方式 (与 fast-context-mcp 一致)

```json
{
  "mcpServers": {
    "devin-search": {
      "command": "npx",
      "args": [
        "-y",
        "devin-search-mcp"
      ]
    }
  }
}
```

---

## 验证与测试

```bash
cd E:\project\devin-search-mcp

# 运行底层业务功能测试 (搜索与抓取)
npm test

# 运行真实的 MCP 客户端 Stdio 协议模拟测试
npm run test:mcp
```

---

## 如何发布到 npm

1. **登录 npm**：
   ```bash
   npm login
   ```
2. **发布公有包**：
   ```bash
   npm publish --access public
   ```
3. **GitHub Actions 自动发布**：
   在 GitHub 仓库中配置 Secret `NPM_TOKEN`，每次创建 Release Tag 时会自动触发打包发布。

---

## 许可证
MIT License
