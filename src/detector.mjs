/**
 * Devin 运行环境与安装路径探测模块
 * 支持自动探测 Windows / macOS / Linux 下的 devin.exe 和登录凭据
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir, platform } from "node:os";
import { execFileSync } from "node:child_process";

/**
 * 获取系统平台候选的 devin.exe / devin 路径
 */
export function getDevinPathCandidates() {
  const plat = platform();
  const home = homedir();
  const candidates = [];

  // 1. 优先使用环境变量指定
  if (process.env.DEVIN_PATH) {
    candidates.push(process.env.DEVIN_PATH);
  }
  if (process.env.DEVIN_EXE_PATH) {
    candidates.push(process.env.DEVIN_EXE_PATH);
  }

  if (plat === "win32") {
    const localAppData = process.env.LOCALAPPDATA || join(home, "AppData", "Local");
    const programFiles = process.env.ProgramFiles || "C:\\Program Files";

    candidates.push(
      // 用户当前机器的主安装路径
      "E:\\Program\\devin\\resources\\app\\extensions\\windsurf\\devin\\bin\\devin.exe",
      "D:\\Program\\devin\\resources\\app\\extensions\\windsurf\\devin\\bin\\devin.exe",
      "C:\\Program\\devin\\resources\\app\\extensions\\windsurf\\devin\\bin\\devin.exe",
      // Windows 默认安装位置
      join(localAppData, "Programs", "Devin", "resources", "app", "extensions", "windsurf", "devin", "bin", "devin.exe"),
      join(programFiles, "Devin", "resources", "app", "extensions", "windsurf", "devin", "bin", "devin.exe"),
      // 官方独立 CLI 安装路径
      join(localAppData, "devin", "bin", "devin.exe"),
      join(home, ".devin", "bin", "devin.exe")
    );
  } else if (plat === "darwin") {
    candidates.push(
      "/Applications/Devin.app/Contents/Resources/app/extensions/windsurf/devin/bin/devin",
      join(home, "Applications", "Devin.app", "Contents", "Resources", "app", "extensions", "windsurf", "devin", "bin", "devin"),
      join(home, ".local", "bin", "devin"),
      "/usr/local/bin/devin"
    );
  } else {
    // Linux
    candidates.push(
      join(home, ".local", "bin", "devin"),
      join(home, ".devin", "bin", "devin"),
      "/usr/local/bin/devin",
      "/usr/bin/devin"
    );
  }

  return candidates;
}

/**
 * 自动查找有效的 devin 可执行文件路径
 */
export function findDevinExecutable() {
  const candidates = getDevinPathCandidates();
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) {
      return candidate;
    }
  }

  // 尝试直接通过系统 PATH 执行 devin
  try {
    const cmd = platform() === "win32" ? "where.exe devin" : "which devin";
    const stdout = execFileSync(platform() === "win32" ? "cmd.exe" : "sh", [
      platform() === "win32" ? "/c" : "-c",
      cmd,
    ], { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }).trim();

    const firstMatch = stdout.split(/\r?\n/)[0]?.trim();
    if (firstMatch && existsSync(firstMatch)) {
      return firstMatch;
    }
  } catch {
    // PATH 中未找到
  }

  return null;
}

/**
 * 获取凭证配置文件路径
 */
export function getCredentialsPath() {
  const plat = platform();
  const home = homedir();

  let credPath = "";
  if (plat === "win32") {
    const appdata = process.env.APPDATA || join(home, "AppData", "Roaming");
    credPath = join(appdata, "devin", "credentials.toml");
  } else {
    credPath = join(home, ".local", "share", "devin", "credentials.toml");
  }

  if (existsSync(credPath)) {
    return credPath;
  }
  return null;
}

/**
 * 读取 Devin 登录状态与信息
 */
export function inspectDevinStatus() {
  const executable = findDevinExecutable();
  const credentialsPath = getCredentialsPath();

  let hasToken = false;
  let tokenSnippet = null;

  if (credentialsPath && existsSync(credentialsPath)) {
    try {
      const content = readFileSync(credentialsPath, "utf-8");
      const match = content.match(/windsurf_api_key\s*=\s*"([^"]+)"/);
      if (match && match[1]) {
        hasToken = true;
        tokenSnippet = match[1].slice(0, 25) + "...";
      }
    } catch {
      // 忽略读取错误
    }
  }

  let authStatusText = "";
  if (executable) {
    try {
      authStatusText = execFileSync(executable, ["auth", "status"], {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 15000,
      }).trim();
    } catch (err) {
      authStatusText = err.stdout || err.message;
    }
  }

  const isLoggedIn = authStatusText.includes("Logged in") || hasToken;

  return {
    executable,
    credentialsPath,
    hasToken,
    tokenSnippet,
    isLoggedIn,
    statusSummary: authStatusText,
  };
}
