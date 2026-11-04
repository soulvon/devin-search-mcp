<div align="center">

# 🔍 Devin Search MCP

### Real-time web access for your AI — Devin's native gateway, reverse-engineered

**~1s response · 0 LLM tokens · 0 local processes · 0 configuration**

[![npm version](https://img.shields.io/npm/v/devin-search-mcp.svg)](https://www.npmjs.com/package/devin-search-mcp)
[![npm downloads](https://img.shields.io/npm/dt/devin-search-mcp.svg?color=orange)](https://www.npmjs.com/package/devin-search-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node: >=18](https://img.shields.io/badge/Node.js->=18-green.svg)](https://nodejs.org/)

[English](README_en.md) • [简体中文](README.md)

</div>

---

> [!TIP]
> **🎉 No Desktop App Required**: One-click browser OAuth login is now supported! Run `npx devin-search-mcp login` to authenticate with Google / GitHub for free. If you already have Devin or Windsurf installed and logged in, it will also be detected automatically.

**Your AI is brilliant — and it lives in a training cutoff.**

Ask what a framework shipped last week? It hallucinates, confidently. Hand it a doc link? It can't reach the web — or fetches a wall of ads.

The usual fixes are worse: scrapers die on CAPTCHAs, fetched pages are 80% navigation junk, and parsing one page burns one LLM call.

**We cut the entire chain.**

Devin Desktop ships one of the cleanest tech-search channels in the market — officially curated, no CAPTCHAs, straight to content. Locked inside the Devin client.

**This project pried it out**: reverse-engineered Devin's native binary protocol, Node.js speaking raw Protobuf straight to the official retrieval gateway. Your Cursor / CodeBuddy / Claude now search the web exactly like Devin does.

### ⚡ By the numbers

| | Scraper + LLM parsing | 🔍 Devin Search MCP |
| :--- | :--- | :--- |
| **Response time** | 3 – 10 s | **~1 s** |
| **Model tokens** | One LLM call per page | **0 (native RPC, zero inference)** |
| **CAPTCHAs** | Daily | **None** |
| **Data cleanliness** | HTML wreckage | **Structured JSON / Markdown** |
| **Local dependency** | Heavy client process | **Zero processes** |
| **Setup** | Apply for an API key | **One `npx` line, live in 30 s** |

### 🎬 What it looks like

```bash
You: "What are the breaking changes in Next.js 15 Server Actions?"

  ⚡ devin_web_search("Next.js 15 Server Actions breaking changes")
  ✓ 1.2s · 5 results · 0 tokens

  [1] Next.js 15 upgrade guide — nextjs.org
  [2] React 19 & Async Request APIs changes — react.dev
  [3] Server Actions migration in practice — blog.example.dev

You: "Fetch #1 and read it closely"
  ⚡ devin_web_fetch("https://nextjs.org/docs/...", extract_mode="markdown")
  ✓ 0.8s · 4,200 words of clean text · ads & nav stripped
```

### 🔬 How it works

```text
┌────────────────────────────────────────────────────────┐
│           Devin Search MCP (native-speed build)        │
│              (a lightweight local service)             │
│                                                        │
│  1. Extract the local Devin login token (sql.js)       │
│  2. Exchange it for a JWT (cached in memory)           │
│  3. Build binary Protobuf packets → native gateway     │
│  4. Parse the binary stream into title/URL/snippet     │
│  5. Cache hit? Answer instantly. Miss? Fetch & store   │
└────────────────────────────────────────────────────────┘
```

**No heavy client. No LLM in the middle. Just one layer of Protobuf.**

### 🚀 Quick start

#### Step 1: One-click OAuth login (no app required · first time only)

If you don't have Devin Desktop installed, run this one-line command to authenticate in your browser for free:

```bash
npx devin-search-mcp login
```

A browser window will open supporting **Google / GitHub / Email login**. Once authorized, your credentials will be stored locally.  
*(Note: If Devin Desktop or Windsurf is already installed and logged in, you can skip this step!)*

#### Step 2: Add to your AI environment

**CodeBuddy / Cursor** — in your MCP config (`mcp.json` / `.cursor/mcp.json`):

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

**Claude Desktop** — same `mcpServers` block in `claude_desktop_config.json`, then restart.

**Claude Code (CLI)**:

```bash
claude mcp add devin-search -- npx -y devin-search-mcp
```

### 🧰 Three tools

| Tool | Capability | Key parameters |
| :--- | :--- | :--- |
| **`devin_web_search`** | Native ultra-fast web search, returns structured `title + url + snippet` | `query` (required), `num_results` (default 5), `detailed` |
| **`devin_web_fetch`** | Deep page reader — strips ads, popups and navbars | `url`, `extract_mode` (`markdown` default / `text`) |
| **`extract_devin_key`** | Cross-platform extraction of the locally active Devin / Windsurf token | Same UX as `fast-context-mcp`'s `extract_windsurf_key` |

### FAQ

<details>
<summary><b>Do I need Devin Desktop installed?</b></summary>
<br>
<b>Not anymore!</b> Version 2.1 introduces one-click browser OAuth: simply run <code>npx devin-search-mcp login</code> once in your terminal. If you do have Devin Desktop or Windsurf installed and logged in, credentials will also be extracted automatically.
</details>

<details>
<summary><b>Why not just scrape Google / Bing?</b></summary>
<br>
Public scrapers get CAPTCHA-walled daily. Devin's internal retrieval channel is officially curated for technical Q&A and developer docs — precision, cleanliness and speed are on another level.
</details>

<details>
<summary><b>Is it really zero token consumption?</b></summary>
<br>
Yes. <code>devin_web_search</code> uses the native retrieval RPC — <b>no LLM inference anywhere</b>. Search happens on the gateway, parsing happens locally, your model quota is untouched.
</details>

<details>
<summary><b>Does searching the same keyword twice hit the gateway again?</b></summary>
<br>
No. Repeat queries within the cache window return in 0 ms from memory; the cache re-fetches automatically when it expires.
</details>

For full AI agent machine instructions, check [AI_PROMPT.md](AI_PROMPT.md).

---

---

## 🔗 More from soulvon

The full AI toolbox by the same author:

| 项目 Project | 简介 What it does |
| :--- | :--- |
| [🚀 **AnyBridge**](https://github.com/soulvon/AnyBridge) ![Downloads](https://img.shields.io/github/downloads/soulvon/AnyBridge/total?color=orange) | BYOK 模型接入工作台：统一管理 16+ AI 编程智能体（Cursor / Windsurf / Devin / Claude Code / Codex / CodeBuddy 等）的模型渠道，本地代理接管 + 配置直写 · Unified BYOK model access for 16+ AI coding agents |
| [🪁 **Kite**](https://github.com/soulvon/Kite) ![Downloads](https://img.shields.io/github/downloads/soulvon/Kite/total?color=orange) | Windsurf / Devin 多账号号池与 AI IDE 增强套件：额度监控、耗尽自动切换、多实例分身 · Multi-account pool & IDE enhancement suite for Windsurf / Devin |
| [🛸 **Antigravity-Kite**](https://github.com/soulvon/Antigravity-Kite) ![Open VSX Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fopen-vsx.org%2Fapi%2Fsoulvon%2Fantigravity-kite&query=%24.downloadCount&label=openvsx%20downloads&color=orange) | Antigravity 多账号无感切号与号池管理：Claude / Gemini 双模型双窗口官方配额、安全声明自动确认、双语自适应 · Seamless multi-account switcher & pool for Antigravity IDE |
| [🎫 **BuddyRelay**](https://github.com/soulvon/BuddyRelay) ![Open VSX Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fopen-vsx.org%2Fapi%2Fsoulvon%2Fbuddy-relay&query=%24.downloadCount&label=openvsx%20downloads&color=orange) | CodeBuddy / WorkBuddy 多账号切换插件：多窗口号池同步、额度流水对账、自动切号，已上架 Open VSX · Multi-account switcher extension for CodeBuddy / WorkBuddy |

> All open source · local-first · actively maintained — see the [author profile](https://github.com/soulvon) for all projects.

---

---

## ⭐ Star History

**如果这个工具帮到了你，点一个 Star 让更多开发者看到它 · If this project helps you, a star means a lot.**

[![Star History Chart](https://api.star-history.com/svg?repos=soulvon/soulvon/devin-search-mcp&type=Date)](https://star-history.com/#soulvon/soulvon/devin-search-mcp&Date)

---

## License

MIT License © 2026 soulvon
