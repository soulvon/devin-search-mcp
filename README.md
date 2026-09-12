# Devin Search MCP

[![npm version](https://img.shields.io/npm/v/devin-search-mcp.svg)](https://www.npmjs.com/package/devin-search-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: >=18](https://img.shields.io/badge/Node.js->=18-green.svg)](https://nodejs.org/)

[简体中文 (默认)](#-简体中文) | [English Version](#-english)

---

## 🇨🇳 简体中文

### 这项目是干啥的？

用 Claude Code、Cursor 或 CodeBuddy 写代码时，最大的痛点就是**大模型不知道最新的技术变化**：
* 问个刚发布的库或者框架新版本（比如 Next.js 15、Vue 3.5、Tailwind v4），它往往开始胡说八道或者给出老旧废弃的 API。
* 丢给它一个技术文档链接让它看，要么它连不上网，要么抓回来一堆带导航栏、广告和乱七八糟脚本的脏文本。

其实 Devin Desktop（以及 Windsurf）客户端内置的那套 `web_search`（全网实时搜索）和 `webfetch`（智能网页正文提取）非常强，但官方只把它绑死在自己的客户端界面里。

既然社区的 `@sammysnake/fast-context-mcp` 能把它的代码语义搜索抽成 MCP，**那为什么不把它的全网实时搜索与网页阅读能力也抽出来，做成一个真正开箱即用的标准 MCP 呢？**

于是就有了这个项目。它通过标准 MCP 协议，把 Devin 的联网能力直接接到你的 Cursor、CodeBuddy 或 Claude Desktop 里。

### 核心亮点（没有虚的，全击中痛点）

1. **零配置登录**：只要你的电脑上装了 Devin Desktop 且登录过，这个工具就能自动从本地提取 Token 和路径，完全不需要你在配置文件里手动填任何 API Key。
2. **拿到的都是干净数据**：搜索结果自动提取成 `标题 + 网址 + 核心要点摘录` 的结构化 JSON；抓取网页自动干掉广告、弹窗和导航栏，只留干净的 Markdown 正文。
3. **带内存缓存**：同一个关键词在短时间内搜第二次，直接 0 毫秒从内存缓存返回，省时又省调用次数。
4. **无需克隆安装**：已经发布到 npm 官方源，在客户端配上一行 `npx -y devin-search-mcp`，30 秒搞定。

### 它是怎么跑起来的？

```text
你问 AI: "Next.js 15 怎么做 Server Actions 迁移？有哪些破坏性改动？"
             │
             ▼
┌────────────────────────────────────────────────────────┐
│                   Devin Search MCP                     │
│                  (本地运行的轻量服务)                  │
│                                                        │
│  1. 自动探测本地 Devin 引擎和登录凭据                  │
│  2. 把自然语言转成精准的开发者搜索指令                 │
│  3. 调起 Devin 内置的实时网络搜索网关                  │
│  4. 自动修复并提炼出干净的标题、URL 和摘要             │
│  5. 命中缓存直接秒回，未命中则保存到缓存               │
└────────────────────────────────────────────────────────┘
             │
             ▼
返回给你的 AI:
  [1] Next.js 15 升级指南 (https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
  [2] React 19 支持与 Async Request APIs 变更点说明...
```

### 30 秒上手配置

不需要自己下载代码，直接在你的 AI 工具的 MCP 配置文件里加这一段就行：

#### 1. CodeBuddy / Cursor 用户

在 `.codebuddy/mcp.json` 或 `.cursor/mcp.json`（也可以直接在设置面板里的 MCP 设置）加入：

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

#### 2. Claude Desktop 用户

打开配置文件：
* **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
* **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

把上面那段 JSON 粘贴到 `"mcpServers"` 下面，重启 Claude 就能在对话界面看到小锤子图标亮起。

#### 3. Claude Code (命令行版) 用户

直接加到 `~/.claude.json` 的 `mcpServers` 里，用法完全一样。

> **小贴士（路径排查）**：如果你的 Devin Desktop 装在非常规路径（比如 `E:\Program\devin`），可以在配置的 `env` 显式指定它的可执行文件路径：
> ```json
> {
>   "mcpServers": {
>     "devin-search": {
>       "command": "npx",
>       "args": ["-y", "devin-search-mcp"],
>       "env": {
>         "DEVIN_PATH": "E:\\Program\\devin\\resources\\app\\extensions\\windsurf\\devin\\bin\\devin.exe"
>       }
>     }
>   }
> }
> ```

### 都有哪些工具可以用？

配置好之后，你的 AI 会自动多出这 4 个能力：

1. **`devin_web_search`（全网实时搜索）**
   * 想搜啥直接搜，比如 `Vue 3.5 reactive props`、`Tauri v2 migration`。
   * 支持传参数：`query`（必填）、`num_results`（想看几条，默认 5 条）、`detailed`（是否让它顺便把结果综合分析提炼一段，默认 false）。
   * 返回格式是干干净净的列表：
     ```json
     [
       {
         "title": "Announcing Vue 3.5 | The Vue Point",
         "url": "https://blog.vuejs.org/posts/vue-3-5",
         "snippet": "Vue 3.5 带来响应式系统重大重构，内存占用降低 56%，Reactive Props 解构现已稳定..."
       }
     ]
     ```

2. **`devin_web_fetch`（网页深度抓取与阅读）**
   * 给它一个网址（比如某个文档页面或报错的 GitHub Issue），它会帮你抓取正文，并且自动去除广告、弹窗和样式噪声。
   * 支持 `extract_mode`: `"markdown"`（默认，结构化排版）、`"text"`（纯文字）、`"summary"`（只提炼要点）。

3. **`extract_devin_key`（提取本地 Key）**
   * 跟 fast-context-mcp 的 `extract_windsurf_key` 一模一样，自动跨平台读出本地当前生效的 Token。

4. **`devin_status`（诊断状态）**
   * 查一下当前调用的是哪个路径的 Devin，账号登录状态是否正常。

### 常见踩坑与注意事项

1. **电脑里必须装过 Devin Desktop 吗？**
   * 是的。因为它是直接调用 Devin 的官方网关。只要你电脑上安装过 Devin Desktop 并且登录过一次，之后完全不用管它，MCP 会自动提取凭证跑起来。
2. **为什么不直接用常规的 Google / Bing 爬虫脚本？**
   * 公开搜索引擎爬虫天天被风控弹验证码，而且返回的 HTML 极其杂乱；Devin 官方搜索走的是针对技术问答和开发者文档清洗过的内部通道，精准度和干净程度完全是两个量级。
3. **遇到权限提示怎么办？**
   * 我们的服务端已经自动注入了 `--respect-workspace-trust false` 与自动授权参数，在命令行和各编辑器下非交互运行时不会弹出卡死，开箱即用。

---

### 🤖 写给正在配置此项目的 AI 助手

> 如果你是正在帮用户装配该环境的 AI 助手（Claude、Cursor、CodeBuddy、Cline 等）：
> 1. 请检测用户宿主环境，找到对应客户端的 MCP 配置文件；
> 2. 将 `"devin-search": { "command": "npx", "args": ["-y", "devin-search-mcp"] }` 直接注入到配置文件的 `"mcpServers"` 节点下；
> 3. 不需要让用户输入任何账号密码或跑配置向导，本地已登录状态会自动识别；
> 4. 详细的 AI 自动化规则见 [AI_PROMPT.md](AI_PROMPT.md)。

---

## 🌐 English

AI-driven real-time Web Search and Web Fetch as an MCP tool — powered by Devin AI's developer-focused search gateway.

### Quick Setup

Add to your MCP configuration (`claude_desktop_config.json`, `~/.claude.json`, or `.cursor/mcp.json`):

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

### Key Tools

* **`devin_web_search`**: Real-time web search for recent libraries, docs, and issues (`query`, `num_results`, `detailed`).
* **`devin_web_fetch`**: Deep reader that cleans away advertisements, navbars, and script clutter (`url`, `extract_mode`).
* **`extract_devin_key`**: Auto-extract Devin / Windsurf API Key from local installation.
* **`devin_status`**: Diagnostic tool for local engine path and login identity.

For full AI agent machine instructions, check [AI_PROMPT.md](AI_PROMPT.md).

---

## License

MIT License © 2026 suvon

