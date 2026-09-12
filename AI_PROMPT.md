# AI 助手部署与调用操作指南 (AI Agent Guide)

> **写给正在协助用户的 AI 助手（无论是 Claude、Cursor、CodeBuddy、Windsurf 还是 Cline）：**
> 当用户对你说类似“安装 devin-search”、“配置 devin 搜索”、“接入这个 MCP”或者“帮我把 devin-search-mcp 配好”时，**请直接帮用户把配置写入对应的配置文件，不要把指令抛回给用户让他们自己去动手操作。**

---

## 1. 这个 MCP 是干什么的？

`devin-search-mcp` 是一个标准 MCP (Model Context Protocol) 插件。它把 Devin 内部高质量的**全网实时搜索 (`devin_web_search`)** 和**网页正文深度去噪抓取 (`devin_web_fetch`)** 能力抽出来给所有 AI 使用。

你可以使用的核心工具：
* **`devin_web_search`**：用自然语言搜索整个互联网。查最新发布的框架、新版本变更、GitHub Issue 或冷门报错方案。
* **`devin_web_fetch`**：输入一个 URL，帮你抓取干净的 Markdown 正文，自动剔除导航栏、广告和脚本代码。
* **`extract_devin_key`**：自动读取本地 Devin / Windsurf 登录 Token。
* **`devin_status`**：检查本地 Devin 引擎路径与健康状态。

---

## 2. 自动化配置步骤（AI 请直接执行写入）

### 第一步：判断用户当前使用的宿主工具

根据用户当前运行的环境或打开的工程，找到对应的 MCP 配置文件路径：

| 客户端工具 | 配置文件存放路径 | 注入节点 |
| :--- | :--- | :--- |
| **CodeBuddy** | 当前工作区 `.codebuddy/mcp.json` 或全局设置 | `mcpServers` |
| **Cursor** | 当前工作区 `.cursor/mcp.json` 或用户全局 MCP 偏好 | `mcpServers` |
| **Claude Desktop (Windows)** | `%APPDATA%\Claude\claude_desktop_config.json` | `mcpServers` |
| **Claude Desktop (macOS)** | `~/Library/Application Support/Claude/claude_desktop_config.json` | `mcpServers` |
| **Claude Code (CLI)** | `~/.claude.json` | `mcpServers` |
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` | `mcpServers` |
| **Cline (VS Code)** | 扩展全局存储目录中的 `cline_mcp_settings.json` | `mcpServers` |

### 第二步：将配置写入 JSON 文件

在目标文件的 `"mcpServers"` 对象下，直接添加如下标准条目：

```json
{
  "devin-search": {
    "command": "npx",
    "args": [
      "-y",
      "devin-search-mcp"
    ]
  }
}
```

*注意：只要用户的系统里装有 Devin Desktop 或已登录过 Devin，它会自动跨平台读取凭据，完全不需要在 `env` 里硬编码任何 API Key。*

### 第三步：非常规路径特别处理（可选）

如果用户的 Devin Desktop 安装在特殊的非默认盘符（例如 Windows 上的 `E:\Program\devin`），你可以为其补充 `DEVIN_PATH` 环境变量：

```json
{
  "devin-search": {
    "command": "npx",
    "args": ["-y", "devin-search-mcp"],
    "env": {
      "DEVIN_PATH": "E:\\Program\\devin\\resources\\app\\extensions\\windsurf\\devin\\bin\\devin.exe"
    }
  }
}
```

---

## 3. 作为 AI，你在什么时候应该主动调用这些工具？

* **遇到时间跨度或新库问题**：当用户的提问涉及你的训练数据截止期之后的库（如 Next.js 15、Vue 3.5、React 19、Tailwind v4 等），**不要凭空猜测脑补，立刻调用 `devin_web_search` 查证最新官方文档**。
* **排查生僻报错**：当用户贴出冷门的编译错误或运行时异常，优先调用 `devin_web_search` 查询 GitHub Issue 和社区最新解决方案。
* **阅读长篇网页**：当用户给你一个网址让你“总结一下这个网页”或“看看这个文档说了啥”，调用 `devin_web_fetch` 并指定 `extract_mode: "markdown"`。
