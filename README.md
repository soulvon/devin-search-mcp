# Devin Search MCP

[![npm version](https://img.shields.io/npm/v/devin-search-mcp.svg)](https://www.npmjs.com/package/devin-search-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: >=18](https://img.shields.io/badge/Node.js->=18-green.svg)](https://nodejs.org/)

AI-driven real-time Web Search and Web Fetch as an MCP tool — powered by Devin AI's developer-focused search gateway.

Any MCP-compatible client (**Claude Code, Claude Desktop, Cursor, CodeBuddy, Windsurf, Cline**, etc.) can use this to search the open web with natural language and fetch clean webpage content without noise.

---

## How It Works

```text
You: "What's new in Next.js 15 and how to migrate?"
         │
         ▼
┌────────────────────────────────────────────────────────┐
│                   Devin Search MCP                     │
│                  (Local MCP Server)                    │
│                                                        │
│  1. Auto-detects local Devin engine & credentials      │
│  2. Translates query into optimal search parameters    │
│  3. Invokes Devin's developer-tuned web_search engine  │
│  4. Parses results with bracket-balanced repair        │
│  5. Strips noise, navbars & ads (webfetch)             │
│  6. Caches results in-memory with TTL                  │
│  7. Returns clean structured JSON / Markdown           │
└────────────────────────────────────────────────────────┘
         │
         ▼
Found 5 relevant results.
  [1/5] Next.js 15 Release Notes (https://nextjs.org/blog/next-15)
  [2/5] Upgrade Guide: v14 to v15 (https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
  [3/5] React 19 RC Integration Notes...

[config] query="Next.js 15 migration", latency=650ms, cached=false
```

---

## Prerequisites

* **Node.js** >= 18
* **Devin account** — Free tier works (auto-extracts credentials from local installation)
* Works on **macOS**, **Windows**, and **Linux**

---

## Quick Setup (Recommended)

No installation required! Use `npx` directly in your MCP client configuration.

### 1. Claude Code (CLI)

Add to `~/.claude.json` under `mcpServers`:

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

### 2. Claude Desktop

Add to `claude_desktop_config.json` under `mcpServers`:

* **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

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

### 3. Cursor / CodeBuddy

Add to `.cursor/mcp.json` or `.codebuddy/mcp.json` (or Global Settings):

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

> **Note on Custom Devin Path**: If Devin Desktop is installed in a non-standard directory (e.g. `E:\Program\devin`), specify `DEVIN_PATH` in `env`:
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

---

## Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DEVIN_PATH` | *(auto-discovered)* | Custom absolute path to `devin.exe` or `devin` executable |
| `DEVIN_API_KEY` | *(auto-discovered)* | Override Devin Session Token or API Key |
| `WINDSURF_API_KEY` | *(auto-discovered)* | Fallback API Key compatibility |
| `DEVIN_TIMEOUT_MS` | `35000` | Search/Fetch timeout in milliseconds |

---

## MCP Tools

### `devin_web_search`

AI-driven real-time web search with structured output.

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `query` | string | **Yes** | — | Natural language search query or keywords |
| `num_results` | integer | No | `5` | Maximum number of results to return (1-15) |
| `detailed` | boolean | No | `false` | If `true`, includes an in-depth AI synthesis summary alongside sources |

**Example output:**

```json
[
  {
    "title": "Announcing Vue 3.5 | The Vue Point",
    "url": "https://blog.vuejs.org/posts/vue-3-5",
    "snippet": "Vue 3.5 includes reactive props destructure, 56% memory optimization..."
  }
]
```

### `devin_web_fetch`

Deep webpage scraping and reader that cleans away advertisements, navigation bars, and cookie banners.

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `url` | string | **Yes** | — | Target webpage URL (http:// or https://) |
| `extract_mode` | string | No | `"markdown"` | Output format: `"markdown"`, `"text"`, or `"summary"` |

### `extract_devin_key`

Auto-extract Devin API Key / Session Token from local installation. Matches `fast-context-mcp`'s `extract_windsurf_key`.

```text
Devin API Key extracted successfully

  Key: devin-session-token$eyJhbGciOi...
  Length: 189
  Source: C:\Users\admin\AppData\Roaming\devin\credentials.toml
  App: Devin

Usage:
  export DEVIN_API_KEY="devin-session-token$..."
```

### `devin_status`

Diagnostic tool: returns local engine path, login identity, and workspace trust status.

---

## For AI Agents: Auto-Deployment Instructions

> 🤖 **If you are an AI Assistant reading this repository to configure MCP for your user:**
> 1. Locate the user's MCP config file (e.g. `~/.claude.json`, `%APPDATA%\Claude\claude_desktop_config.json`, or `.cursor/mcp.json`).
> 2. Add the server entry: `"devin-search": { "command": "npx", "args": ["-y", "devin-search-mcp"] }`.
> 3. No manual user login is needed if Devin is installed on the host.
> 4. For full instruction details, see [AI_PROMPT.md](AI_PROMPT.md).

---

## Project Structure

```text
devin-search-mcp/
├── bin/
│   └── devin-search-mcp.mjs      # Stdio entry point for MCP clients
├── src/
│   ├── index.mjs                 # MCP Server instance & tool handlers
│   ├── detector.mjs              # Multi-platform Devin executable discovery
│   ├── extract-key.mjs           # SQLite (sql.js) & TOML credential extraction
│   ├── search.mjs                # web_search execution & structured parsing
│   ├── fetch.mjs                 # webfetch content cleaner & reader
│   ├── response-repair.mjs       # Bracket-balancing & JSON error repair
│   └── cache.mjs                 # In-memory MD5/TTL result cache
├── .github/
│   └── workflows/publish.yml     # Automated CI/CD release pipeline
├── AI_PROMPT.md                  # Machine-readable deployment guide for AI
├── package.json
├── test.mjs                      # E2E integration test
├── test-mcp-protocol.mjs         # Stdio JSON-RPC protocol test
├── README.md
└── LICENSE
```

---

## License

MIT License © 2026 suvon
