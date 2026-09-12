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

1. **真正的极速，1 秒级响应**：
   我们没有采用“后台启动几十 MB 的 `devin.exe` 重型客户端、让大模型慢慢思考推理”的那种笨办法。
   而是直接**逆向了 Devin 底层的二进制协议**，纯用 Node.js 发二进制 Protobuf 网络包，直连官方原生的 `GetWebSearchResults` 检索网关！
   - **不启动任何本地客户端进程**
   - **不经过任何大模型推理，零模型额度消耗**
   - 实测首次检索 **1.5 秒**，后续缓存 JWT 后稳定 **1 秒左右** 返回。
2. **零配置登录**：只要你的电脑上装了 Devin Desktop 且登录过，这个工具就能自动从本地提取 Token（跨平台支持 `credentials.toml` 与 `state.vscdb`），完全不需要你在配置文件里手动填任何 API Key。
3. **拿到的都是干净数据**：搜索结果自动提取成 `标题 + 网址 + 核心要点摘录` 的结构化 JSON；抓取网页自动干掉广告、弹窗和导航栏，只留干净的 Markdown 正文。
4. **带内存缓存**：同一个关键词在短时间内搜第二次，直接 0 毫秒从内存缓存返回，省时又省调用次数。
5. **无需克隆安装**：已经发布到 npm 官方源，在客户端配上一行 `npx -y devin-search-mcp`，30 秒搞定。

### 它是怎么跑起来的？

```text
你问 AI: "Next.js 15 怎么做 Server Actions 迁移？有哪些破坏性改动？"
             │
             ▼
┌────────────────────────────────────────────────────────┐
│              Devin Search MCP (极速架构版)             │
│                  (本地运行的轻量服务)                  │
│                                                        │
│  1. 自动从本地提取 Devin 登录 Token (sql.js 读凭证)    │
│  2. 用 Token 换取 JWT (内存缓存，避免重复握手)         │
│  3. 构建二进制 Protobuf 包，直连官方原生检索网关       │
│  4. 解析网关返回的二进制流，提炼标题/URL/摘要          │
│  5. 命中缓存直接秒回，未命中则写入缓存                 │
└────────────────────────────────────────────────────────┘
             │
             ▼
返回给你的 AI:
  [config] query="..." 耗时=1259ms 缓存=false

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

### 都有哪些工具可以用？

配置好之后，你的 AI 会自动多出这几个能力：

1. **`devin_web_search`（全网实时极速检索）**
   * 想搜啥直接搜，比如 `Vue 3.5 reactive props`、`Tauri v2 migration`。
   * 支持传参数：`query`（必填）、`num_results`（想看几条，默认 5 条）、`detailed`（是否附带 AI 综合总结）。
   * 返回格式是干干净净的列表：
     ```json
     [
       {
         "title": "Announcing Vue 3.5 | The Vue Point",
         "url": "https://blog.vuejs.org/posts/vue-3-5",
         "snippet": "Vue 3.5 带来响应式系统重大重构，内存占用降低 56%..."
       }
     ]
     ```

2. **`devin_web_fetch`（网页深度抓取与阅读）**
   * 给它一个网址（比如某个文档页面或报错的 GitHub Issue），它会帮你抓取正文，并且自动去除广告、弹窗和样式噪声。
   * 支持 `extract_mode`: `"markdown"`（默认，结构化排版）、`"text"`（纯文字）。

3. **`extract_devin_key`（提取本地 Key）**
   * 跟 fast-context-mcp 的 `extract_windsurf_key` 一模一样，自动跨平台读出本地当前生效的 Token。

### 常见踩坑与注意事项

1. **电脑里必须装过 Devin Desktop 吗？**
   * 是的。因为它是直接调用 Devin 的官方网关。只要你电脑上安装过 Devin Desktop 并且登录过一次，之后完全不用管它，MCP 会自动提取凭证跑起来。
2. **为什么不直接用常规的 Google / Bing 爬虫脚本？**
   * 公开搜索引擎爬虫天天被风控弹验证码；而这个走的是 Devin 官方针对技术问答和开发者文档清洗过的内部检索通道，精准度和干净程度完全是两个量级，而且速度极快。
3. **真的不消耗我的模型额度吗？**
   * 是的。`devin_web_search` 走的是原生检索 RPC，**不经过大模型推理，零额度消耗**。这点与 `fast-context-mcp` 的设计哲学完全一致。

---

### 🤖 写给正在配置此项目的 AI 助手

> 如果你是正在帮用户装配该环境的 AI 助手（Claude、Cursor、CodeBuddy、Cline 等）：
> 1. 请检测用户宿主环境，找到对应客户端的 MCP 配置文件；
> 2. 将 `"devin-search": { "command": "npx", "args": ["-y", "devin-search-mcp"] }` 直接注入到配置文件的 `"mcpServers"` 节点下；
> 3. 不需要让用户输入任何账号密码或跑配置向导，本地已登录状态会自动识别；
> 4. 详细的 AI 自动化规则见 [AI_PROMPT.md](AI_PROMPT.md)。

---

## 🌐 English

AI-driven real-time Web Search and Web Fetch as an MCP tool — powered by Devin's official native search gateway.

### Why It's Blazing Fast

Instead of spawning a heavy local `devin.exe` process and letting a huge LLM reason slowly, this project:
* **Reverse-engineered the native binary protocol** of Devin and calls `GetWebSearchResults` RPC directly.
* **No local client process**, **no LLM inference**, **zero model quota consumption**.
* Typical latency: **~1.5s on first call, ~1s afterwards (JWT cached)**.

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

* **`devin_web_search`**: Native ultra-fast real-time web search (`query`, `num_results`, `detailed`).
* **`devin_web_fetch`**: Deep webpage reader that cleans away advertisements and navbars (`url`, `extract_mode`).
* **`extract_devin_key`**: Auto-extract Devin / Windsurf API Key from local installation.

For full AI agent machine instructions, check [AI_PROMPT.md](AI_PROMPT.md).

---

## License

MIT License © 2026 suvon
