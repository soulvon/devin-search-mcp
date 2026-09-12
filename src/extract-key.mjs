/**
 * Devin / Windsurf API Key 本地自动提取模块
 * 模仿 fast-context-mcp 的跨平台本地凭证自动提取实现
 * 依赖 sql.js (纯 WebAssembly/JS)，无需本地 C++ 编译环境
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir, platform } from "node:os";
import initSqlJs from "sql.js";

const TOML_API_KEY_FIELDS = [
  "windsurf_api_key",
  "devin_api_key",
  "api_key",
  "apiKey",
  "access_token",
  "token",
];

/**
 * 获取平台相关的 state.vscdb 候选路径
 */
export function getDbPathCandidates() {
  const plat = platform();
  const home = homedir();
  const env = process.env;

  if (plat === "darwin") {
    return ["Devin", "Windsurf"].map((appName) =>
      join(home, "Library", "Application Support", appName, "User", "globalStorage", "state.vscdb")
    );
  }

  if (plat === "win32") {
    const appdata = env.APPDATA || join(home, "AppData", "Roaming");
    return ["Devin", "Windsurf"].map((appName) =>
      join(appdata, appName, "User", "globalStorage", "state.vscdb")
    );
  }

  const config = env.XDG_CONFIG_HOME || join(home, ".config");
  return ["Devin", "Windsurf"].map((appName) =>
    join(config, appName, "User", "globalStorage", "state.vscdb")
  );
}

/**
 * 获取 credentials.toml 候选路径
 */
export function getTomlPathCandidates() {
  const plat = platform();
  const home = homedir();
  const env = process.env;

  if (plat === "win32") {
    const appdata = env.APPDATA || join(home, "AppData", "Roaming");
    return [
      join(appdata, "devin", "credentials.toml"),
      join(home, ".devin", "credentials.toml"),
      join(home, ".codeium", "credentials.toml"),
    ];
  }

  return [
    join(home, ".local", "share", "devin", "credentials.toml"),
    join(home, ".config", "devin", "credentials.toml"),
    join(home, ".devin", "credentials.toml"),
    join(home, ".codeium", "credentials.toml"),
  ];
}

/**
 * 从 TOML 文本中提取 key
 */
function extractFromTomlText(text) {
  for (const field of TOML_API_KEY_FIELDS) {
    const match = text.match(new RegExp(`^\\s*${field}\\s*=\\s*(?:"([^"]+)"|'([^']+)'|([^\\s#]+))`, "m"));
    const val = (match?.[1] || match?.[2] || match?.[3] || "").trim();
    if (val && val.length > 10) return val;
  }
  return null;
}

/**
 * 从 SQLite state.vscdb 中提取 session token
 */
async function extractFromSqlite(dbPath) {
  if (!existsSync(dbPath)) return null;

  try {
    const fileBuffer = readFileSync(dbPath);
    const SQL = await initSqlJs();
    const db = new SQL.Database(fileBuffer);

    // 查询所有可能包含 token 的键值
    const res = db.exec("SELECT key, value FROM ItemTable WHERE key LIKE '%devin%' OR key LIKE '%windsurf%' OR key LIKE '%codeium%' OR key LIKE '%token%' OR key LIKE '%auth%'");
    if (!res || !res.length || !res[0].values) return null;

    for (const row of res[0].values) {
      const val = String(row[1] || "");
      // 匹配常见 Token 格式
      const tokenMatch = val.match(/devin-session-token\$[a-zA-Z0-9._-]+|sk-ws-[a-zA-Z0-9._-]+|eyJ[a-zA-Z0-9._-]+/);
      if (tokenMatch) {
        return tokenMatch[0];
      }
    }
  } catch {
    // 忽略解析错误
  }
  return null;
}

/**
 * 跨平台自动提取 Devin API Key
 */
export async function extractDevinKey() {
  // 1. 优先读取环境变量
  if (process.env.DEVIN_API_KEY) {
    return {
      api_key: process.env.DEVIN_API_KEY,
      source: "env:DEVIN_API_KEY",
      app: "Devin",
      length: process.env.DEVIN_API_KEY.length,
    };
  }
  if (process.env.WINDSURF_API_KEY) {
    return {
      api_key: process.env.WINDSURF_API_KEY,
      source: "env:WINDSURF_API_KEY",
      app: "Windsurf",
      length: process.env.WINDSURF_API_KEY.length,
    };
  }

  // 2. 查找 credentials.toml
  for (const tomlPath of getTomlPathCandidates()) {
    if (existsSync(tomlPath)) {
      try {
        const text = readFileSync(tomlPath, "utf-8");
        const key = extractFromTomlText(text);
        if (key) {
          return {
            api_key: key,
            source: tomlPath,
            app: tomlPath.includes("devin") ? "Devin" : "Windsurf",
            length: key.length,
          };
        }
      } catch {}
    }
  }

  // 3. 查找 state.vscdb
  for (const dbPath of getDbPathCandidates()) {
    if (existsSync(dbPath)) {
      const key = await extractFromSqlite(dbPath);
      if (key) {
        return {
          api_key: key,
          source: dbPath,
          app: dbPath.includes("Devin") ? "Devin" : "Windsurf",
          length: key.length,
        };
      }
    }
  }

  return {
    api_key: null,
    source: null,
    app: null,
    length: 0,
  };
}
