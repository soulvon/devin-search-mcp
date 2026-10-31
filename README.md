# Devin Search MCP

**把 Devin 原生全网实时搜索与干净网页提取抽成标准 MCP —— 1 秒级响应 · 零模型额度消耗 · 零本地进程**

[![npm version](https://img.shields.io/npm/v/devin-search-mcp.svg)](https://www.npmjs.com/package/devin-search-mcp)
[![npm downloads](https://img.shields.io/npm/dt/devin-search-mcp.svg?color=orange)](https://www.npmjs.com/package/devin-search-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node: >=18](https://img.shields.io/badge/Node.js->=18-green.svg)](https://nodejs.org/)

[简体中文](#-简体中文) | [English](#-english) | [同系列作品](#-同系列作品--more-from-soulvon)

---

## 🇨🇳 简体中文

### 这项目是干啥的？

用 Claude Code、Cursor 或 CodeBuddy 写代码时，最大的痛点就是**大模型不知道最新的技术变化**：
* 问个刚发布的库或者框架新版本（比如 Next.js 15、Vue 3.5、Tailwind v4），它往往开始胡说八道或者给出老旧废弃的 API。
* 丢给它一个技术文档链接让它看，要么它连不上网，要么抓回来一堆带导航栏、广告和乱七八糟脚本的脏文本。

其实 Devin Desktop（以及 Windsurf）客户端内置的那套 `web_search`（全网实时搜索）和 `webfetch`（智能网页正文提取）非常强，但官方只把它绑死在自己的客户端界面里。

既然社区的 `@sammysnake/fast-context-mcp` 能把它的代码语义搜索抽成 MCP，**那为什么不把它的全网实时搜索与网页阅读能力也抽出来，做成一个真正开箱即用的标准 MCP 呢？**

于是就有了这个项目。它通过标准 MCP 协议，把 Devin 的联网能力直接接到你的 Cursor、CodeBuddy 或 Claude Desktop 里。

### ⚡ 它解决什么问题

| 你遇到的痛点 | 常规方案 | Devin Search MCP 的处理方式 |
| :--- | :--- | :--- |
| **模型不知道新技术** | 靠训练数据硬编，新版本 API 一问就胡说 | 直连 Devin 官方原生检索网关，实时拿到最新技术数据 |
| **搜索引擎爬虫被风控** | Google / Bing 脚本天天弹验证码 | 走 Devin 官方针对技术内容清洗过的内部检索通道，无验证码困扰 |
| **抓回来的网页全是噪声** | 广告、弹窗、导航栏、脚本混在正文里 | 自动清洗成 `标题 + 网址 + 核心摘录` 或纯 Markdown 正文 |
| **解析网页烧模型额度** | 把整页 HTML 塞给大模型总结 | **零模型推理**：原生二进制 RPC 直连，解析在本地完成 |
| **配置繁琐** | 手动申请 API Key、填配置 | 零配置：自动提取本地 Devin 登录凭证，装完即用 |
| **响应慢** | LLM 中转解析动辄数秒 | **1 秒级响应**：首次 ~1.5s，缓存 JWT 后稳定 ~1s |

### 🔥 核心亮点（没有虚的，全击中痛点）

1. **真正的极速，1 秒级响应**：
   我们没有采用"后台启动几十 MB 的 `devin.exe` 重型客户端、让大模型慢慢思考推理"的那种笨办法。
   而是直接**逆向了 Devin 底层的二进制协议**，纯用 Node.js 发二进制 Protobuf 网络包，直连官方原生的 `GetWebSearchResults` 检索网关！
   - **不启动任何本地客户端进程**
   - **不经过任何大模型推理，零模型额度消耗**
   - 实测首次检索 **1.5 秒**，后续缓存 JWT 后稳定 **1 秒左右** 返回。
2. **零配置登录**：只要你的电脑上装过 Devin Desktop 且登录过一次，这个工具就能自动从本地提取 Token（跨平台支持 `credentials.toml` 与 `state.vscdb`），完全不需要你在配置文件里手动填任何 API Key。
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

### 🚀 30 秒上手配置

#### 1. CodeBuddy / Cursor 用户

在 MCP 配置文件（CodeBuddy 为 `mcp.json`，Cursor 为 `.cursor/mcp.json`）中加入：

```json
{
  "mcpServers": {
    "devin-search": {
      "command": "npx",
      "args": ["-y", "devin-search-mcp"]
    }
  }
}
```

#### 2. Claude Desktop 用户

配置文件 `claude_desktop_config.json` 同样加入上面的 `mcpServers` 节点，重启客户端即可。

#### 3. Claude Code (命令行版) 用户

```bash
claude mcp add devin-search -- npx -y devin-search-mcp
```

### 🧰 都有哪些工具可以用？

配置好之后，你的 AI 会自动多出这几个能力：

| 工具 | 能力 | 关键参数 |
| :--- | :--- | :--- |
| **`devin_web_search`** | 全网实时极速检索，返回 `标题 + 网址 + 核心摘录` 结构化列表 | `query`（必填）、`num_results`（默认 5）、`detailed`（附带 AI 综合总结） |
| **`devin_web_fetch`** | 网页深度抓取与阅读，自动去广告/弹窗/导航栏 | `url`、`extract_mode`（`markdown` 默认 / `text` 纯文字） |
| **`extract_devin_key`** | 跨平台提取本地当前生效的 Devin / Windsurf Token | 与 `fast-context-mcp` 的 `extract_windsurf_key` 同款体验 |

搜索返回示例：

```json
[
  {
    "title": "Announcing Vue 3.5 | The Vue Point",
    "url": "https://blog.vuejs.org/posts/vue-3-5",
    "snippet": "Vue 3.5 带来响应式系统重大重构，内存占用降低 56%..."
  }
]
```

### ❓ 常见踩坑与注意事项

<details>
<summary><b>1. 电脑里必须装过 Devin Desktop 吗？</b></summary>
<br>
是的。因为它是直接调用 Devin 的官方网关。只要你电脑上安装过 Devin Desktop 并且登录过一次，之后完全不用管它，MCP 会自动提取凭证跑起来。
</details>

<details>
<summary><b>2. 为什么不直接用常规的 Google / Bing 爬虫脚本？</b></summary>
<br>
公开搜索引擎爬虫天天被风控弹验证码；而这个走的是 Devin 官方针对技术问答和开发者文档清洗过的内部检索通道，精准度和干净程度完全是两个量级，而且速度极快。
</details>

<details>
<summary><b>3. 真的不消耗我的模型额度吗？</b></summary>
<br>
是的。<code>devin_web_search</code> 走的是原生检索 RPC，<b>不经过大模型推理，零额度消耗</b>。这点与 <code>fast-context-mcp</code> 的设计哲学完全一致。
</details>

<details>
<summary><b>4. 搜索结果能存多久？会重复扣调用吗？</b></summary>
<br>
同一关键词短时间内的重复搜索直接命中内存缓存，0 毫秒返回、不重复请求网关；缓存失效后自动重新检索。
</details>

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

### What it solves

| Pain | Usual approach | With Devin Search MCP |
| :--- | :--- | :--- |
| **Model doesn't know new tech** | Hallucinates from stale training data | Official native search gateway, real-time data |
| **Scrapers get CAPTCHA-walled** | Google / Bing scripts break daily | Devin's curated internal search channel |
| **Fetched pages are noisy** | Ads, popups, nav bars mixed into content | Cleaned to `title + url + snippet` or pure Markdown |
| **Parsing pages burns tokens** | Feed whole HTML to an LLM for summarizing | **Zero inference**: native binary RPC, parsed locally |
| **Configuration hassle** | Apply for API keys, fill configs | Zero-config: auto-extracts your local Devin credentials |
| **Slow responses** | LLM-mediated parsing takes seconds | **~1s responses** with JWT caching |

### Quick Setup

Add to your MCP configuration (`claude_desktop_config.json`, `~/.claude.json`, or `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "devin-search": {
      "command": "npx",
      "args": ["-y", "devin-search-mcp"]
    }
  }
}
```

Claude Code (CLI): `claude mcp add devin-search -- npx -y devin-search-mcp`

### Key Tools

| Tool | Capability | Key parameters |
| :--- | :--- | :--- |
| **`devin_web_search`** | Native ultra-fast real-time web search with structured results | `query` (required), `num_results` (default 5), `detailed` |
| **`devin_web_fetch`** | Deep webpage reader that cleans away advertisements and navbars | `url`, `extract_mode` (`markdown` default / `text`) |
| **`extract_devin_key`** | Auto-extract the locally active Devin / Windsurf Token cross-platform | — |

Search result example:

```json
[
  {
    "title": "Announcing Vue 3.5 | The Vue Point",
    "url": "https://blog.vuejs.org/posts/vue-3-5",
    "snippet": "Vue 3.5 brings a major rework of the reactivity system, 56% lower memory..."
  }
]
```

### FAQ

<details>
<summary><b>Do I need Devin Desktop installed?</b></summary>
<br>
Yes — the tool calls Devin's official gateway. Install Devin Desktop, log in once, and the MCP extracts credentials automatically from then on.
</details>

<details>
<summary><b>Why not just scrape Google / Bing?</b></summary>
<br>
Public search engines CAPTCHA scrapers daily. This goes through Devin's internal retrieval channel curated for technical Q&A and developer docs — a different league in precision and cleanliness, and much faster.
</details>

<details>
<summary><b>Does it really consume zero model quota?</b></summary>
<br>
Yes. <code>devin_web_search</code> uses the native retrieval RPC — <b>no LLM inference, zero quota consumption</b>, same philosophy as <code>fast-context-mcp</code>.
</details>

For full AI agent machine instructions, check [AI_PROMPT.md](AI_PROMPT.md).

---

## 🔗 同系列作品 / More from soulvon

同一作者的完整 AI 工具箱 · The full AI toolbox by the same author:

| 项目 Project | 简介 What it does |
| :--- | :--- |
| [🚀 **AnyBridge**](https://github.com/soulvon/AnyBridge) ![Downloads](https://img.shields.io/github/downloads/soulvon/AnyBridge/total?color=orange) | BYOK 模型接入工作台：统一管理 16+ AI 编程智能体（Cursor / Windsurf / Devin / Claude Code / Codex / CodeBuddy 等）的模型渠道，本地代理接管 + 配置直写 · Unified BYOK model access for 16+ AI coding agents |
| [🪁 **Kite**](https://github.com/soulvon/Kite) ![Downloads](https://img.shields.io/github/downloads/soulvon/Kite/total?color=orange) | Windsurf / Devin 多账号号池与 AI IDE 增强套件：额度监控、耗尽自动切换、多实例分身 · Multi-account pool & IDE enhancement suite for Windsurf / Devin |
| [🛸 **Antigravity-Kite**](https://github.com/soulvon/Antigravity-Kite) ![Downloads](https://img.shields.io/github/downloads/soulvon/Antigravity-Kite/total?color=orange) | Antigravity 多账号无感切号与号池管理：Claude / Gemini 双模型双窗口官方配额、安全声明自动确认、双语自适应 · Seamless multi-account switcher & pool for Antigravity IDE |
| [🎫 **BuddyRelay**](https://github.com/soulvon/BuddyRelay) ![Open VSX Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fopen-vsx.org%2Fapi%2Fsoulvon%2Fbuddy-relay&query=%24.downloadCount&label=openvsx%20downloads&color=orange) | CodeBuddy / WorkBuddy 多账号切换插件：多窗口号池同步、额度流水对账、自动切号，已上架 Open VSX · Multi-account switcher extension for CodeBuddy / WorkBuddy |

> 全部开源 · 本地优先 · 持续维护 —— 前往 [作者主页](https://github.com/soulvon) 查看全部项目 · All open source, local-first — see the [author profile](https://github.com/soulvon) for all projects.

---

## License

MIT License © 2026 soulvon
