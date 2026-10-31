<div align="center">

# 🔍 Devin Search MCP

### 给你的 AI 装上「实时联网眼」

**Devin 官方原生检索网关 · 逆向直连 · 1 秒返回 · 0 Token 消耗**

[![npm version](https://img.shields.io/npm/v/devin-search-mcp.svg)](https://www.npmjs.com/package/devin-search-mcp)
[![npm downloads](https://img.shields.io/npm/dt/devin-search-mcp.svg?color=orange)](https://www.npmjs.com/package/devin-search-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node: >=18](https://img.shields.io/badge/Node.js->=18-green.svg)](https://nodejs.org/)

**没有重客户端 · 没有验证码 · 没有模型推理 · 没有配置向导**

[English](README_en.md) • [简体中文](README.md)

> [!WARNING]
> **前置要求**：本工具依赖本机 [Devin Desktop](https://devin.ai/download) 的登录凭证（免费注册即可）。装过 + 登录过一次，MCP 会自动提取凭证，无需任何配置。**没有 Devin 账号？免费注册 → https://devin.ai**

</div>

---

**你的 AI 很强，但它活在训练截止日。**

问它上周发布的框架改了什么？它开始一本正经地胡说。丢给它一个文档链接？它连不上网，或者抓回来一屏广告。

解法不是再训一个模型——是**给 AI 接上实时联网**。而这通常意味着：爬虫天天被验证码教育、抓回来 80% 是导航栏、解析一页文档烧一次 LLM 调用。

**我们把这条链路整个砍掉了。**

Devin Desktop 内置的 `web_search` + `webfetch` 是市面上最干净的技术检索通道之一——官方清洗、无验证码、直达内容。但它被锁在 Devin 客户端里。

**这个项目把它拆了出来**：逆向 Devin 底层二进制协议，用 Node.js 直发 Protobuf 包，原生 RPC 直连官方检索网关。你的 Cursor / CodeBuddy / Claude 由此获得与 Devin 同款的联网检索能力。

### ⚡ 数字对比

| | 传统爬虫 + LLM 解析 | 🔍 Devin Search MCP |
| :--- | :--- | :--- |
| **响应速度** | 3 ~ 10 秒 | **~1 秒** |
| **模型额度** | 每页烧一次 LLM 调用 | **0（零推理直连）** |
| **验证码** | 天天弹 | **无** |
| **数据干净度** | HTML 残骸 | **结构化 JSON / Markdown** |
| **本地依赖** | 重客户端进程 | **零进程** |
| **配置成本** | 申请 API Key | **一行 npx，30 秒上线** |

### 🎬 它长什么样

```bash
你: "Next.js 15 的 Server Actions 有哪些破坏性改动？"

  ⚡ devin_web_search("Next.js 15 Server Actions breaking changes")
  ✓ 1.2s · 5 results · 0 tokens

  [1] Next.js 15 升级指南 — nextjs.org
  [2] React 19 与 Async Request APIs 变更点 — react.dev
  [3] Server Actions 迁移实操与踩坑 — blog.example.dev

你: "把第 1 篇抓来精读"
  ⚡ devin_web_fetch("https://nextjs.org/docs/...", extract_mode="markdown")
  ✓ 0.8s · 4,200 字干净正文 · 广告/导航已剥离
```

### 🔬 它是怎么跑起来的

```text
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
```

**没有重客户端 · 没有 LLM 中转 · 只有一层 Protobuf。**

### 🚀 30 秒上手

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

`claude_desktop_config.json` 同样加入上面的 `mcpServers` 节点，重启客户端即可。

#### 3. Claude Code (命令行版) 用户

```bash
claude mcp add devin-search -- npx -y devin-search-mcp
```

### 🧰 三个工具

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

### ❓ FAQ

<details>
<summary><b>必须装过 Devin Desktop 吗？</b></summary>
<br>
是。它直连的是 Devin 官方网关，凭证来自本地已登录的 Devin Desktop——装过、登录过一次，之后全自动。
</details>

<details>
<summary><b>为什么不用 Google / Bing 爬虫？</b></summary>
<br>
公开搜索引擎爬虫天天被验证码教育。Devin 的内部检索通道是官方针对技术问答和开发者文档清洗过的——精准度、干净度、速度全是另一个量级。
</details>

<details>
<summary><b>真的零额度消耗？</b></summary>
<br>
是。<code>devin_web_search</code> 走原生检索 RPC，<b>不经过任何大模型推理</b>。检索在网关完成，解析在你本地完成，模型额度一分不花。
</details>

<details>
<summary><b>同一关键词搜第二次会重复请求吗？</b></summary>
<br>
不会。命中内存缓存直接 0 毫秒返回，不重复请求网关；缓存失效后自动重新检索。
</details>

---

### 🤖 写给正在配置此项目的 AI 助手

> 如果你是正在帮用户装配该环境的 AI 助手（Claude、Cursor、CodeBuddy、Cline 等）：
> 1. 请检测用户宿主环境，找到对应客户端的 MCP 配置文件；
> 2. 将 `"devin-search": { "command": "npx", "args": ["-y", "devin-search-mcp"] }` 直接注入到配置文件的 `"mcpServers"` 节点下；
> 3. 不需要让用户输入任何账号密码或跑配置向导，本地已登录状态会自动识别；
> 4. 详细的 AI 自动化规则见 [AI_PROMPT.md](AI_PROMPT.md)。

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

---

## ⭐ Star History

**如果这个工具帮到了你，点一个 Star 让更多开发者看到它 · If this project helps you, a star means a lot.**

[![Star History Chart](https://api.star-history.com/svg?repos=soulvon/soulvon/devin-search-mcp&type=Date)](https://star-history.com/#soulvon/soulvon/devin-search-mcp&Date)

---

## License

MIT License © 2026 soulvon
