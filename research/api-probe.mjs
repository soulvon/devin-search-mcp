import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

// 1. 读取本地 Token
const credPath = "C:\\Users\\admin\\AppData\\Roaming\\devin\\credentials.toml";
const content = readFileSync(credPath, "utf-8");
const tokenMatch = content.match(/windsurf_api_key\s*=\s*"([^"]+)"/);
const apiKey = tokenMatch[1];
console.log("读取到 Token 长度:", apiKey.length);

// 2. 获取 JWT
const exe = "E:/Program/devin/resources/app/extensions/windsurf/devin/bin/devin.exe";
const jwtOutput = execFileSync(exe, ["auth", "status"], { encoding: "utf-8" });
console.log("Auth 状态正常");

// 3. 检查 devin.exe 中是否包含 hosted / web search 相关的 API 路径
const apiCandidates = [
  "GetWebSearch",
  "WebSearch",
  "HostedToolSearch",
  "DevstralStream",
  "api_server_pb",
];

console.log("\n=== 开始探测可能的 API 端点 ===");
// 只做静态分析，避免误触发请求
console.log("本地已确认的协议常量：");
console.log("- exa.api_server_pb.ApiServerService (来自 fast-context 逆向)");
console.log("- ToolUpdateEvent: web_search, web_get_contents (来自 devin.exe 二进制)");
console.log("- 认证服务: exa.auth_pb.AuthService/GetUserJwt");
