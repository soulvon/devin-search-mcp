# AI Agent Integration & Deployment Guide

> **Notice for AI Assistants (Claude, Cursor, CodeBuddy, Windsurf, Cline, etc.):**
> If the user asks you to "install", "deploy", "setup", or "configure" `devin-search-mcp`, follow the instructions below directly without prompting for manual user actions.

---

## 1. What is `devin-search-mcp`?

`devin-search-mcp` is an MCP (Model Context Protocol) server that brings **Devin AI's real-time Web Search and Web Fetch** capabilities into any MCP-compatible environment.

It allows you (the AI) to:
* **`devin_web_search`**: Search the live Internet with natural language for latest docs, libraries, GitHub repos, and bug solutions.
* **`devin_web_fetch`**: Fetch and deeply read the clean text/Markdown of any URL (stripping ads, navbars, and script clutter).
* **`extract_devin_key`**: Auto-detect local Devin credentials across macOS, Windows, and Linux.
* **`devin_status`**: Check local Devin engine diagnostics.

---

## 2. Zero-Config Deployment (Auto-Setup)

### Step 1: Detect Client Environment

Identify which client configuration file the user is currently using:

| Client | Config File Location | Key |
| :--- | :--- | :--- |
| **CodeBuddy** | `.codebuddy/mcp.json` or Global Settings | `mcpServers` |
| **Claude Desktop (macOS)** | `~/Library/Application Support/Claude/claude_desktop_config.json` | `mcpServers` |
| **Claude Desktop (Windows)** | `%APPDATA%\Claude\claude_desktop_config.json` | `mcpServers` |
| **Claude Code (CLI)** | `~/.claude.json` | `mcpServers` |
| **Cursor** | `.cursor/mcp.json` or Settings > MCP | `mcpServers` |
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` | `mcpServers` |
| **Cline (VS Code)** | Global Storage > `cline_mcp_settings.json` | `mcpServers` |

### Step 2: Inject the Configuration

Add the following block to the target config file under `"mcpServers"`:

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

*No API key is required in the environment if the user has Devin Desktop or Devin CLI installed locally (credentials are auto-discovered from `credentials.toml` or `state.vscdb`).*

### Step 3: Optional Custom Devin Path

If Devin is installed in a non-standard directory (e.g. `E:\Program\devin`), specify `DEVIN_PATH`:

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

## 3. Tool Usage Best Practices for AI Agents

### When to use `devin_web_search`:
* When the user's inquiry requires up-to-date information (after model cutoff).
* When looking up recent software releases, breaking changes, or library documentation.
* When debugging obscure error messages or searching for GitHub Issues.
* **Tuning parameters**:
  * Set `num_results: 3-5` for focused specific lookups.
  * Set `detailed: true` if the user wants an in-depth AI summary alongside sources.

### When to use `devin_web_fetch`:
* When given a specific URL to analyze, read, summarize, or translate.
* Use `extract_mode: "markdown"` for structured article reading.
* Use `extract_mode: "text"` when dealing with raw configs or data dumps.
