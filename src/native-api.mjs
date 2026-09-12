/**
 * Devin / Windsurf 官方原生检索核心层
 * 完全对齐 fast-context-mcp 思路：本地零进程、直连 Connect-RPC、
 * 直接调用官方网关原生检索接口 (不经过任何大模型的重推理)
 */

import { randomUUID } from "node:crypto";
import { platform, arch, release, version as osVersion, hostname, cpus, totalmem } from "node:os";

import {
  ProtobufEncoder,
  extractStrings,
  connectFrameEncode,
  connectFrameDecode,
} from "./protobuf.mjs";

const API_BASE = "https://server.self-serve.windsurf.com/exa.api_server_pb.ApiServerService";
const AUTH_BASE = "https://server.self-serve.windsurf.com/exa.auth_pb.AuthService";
const WS_APP = "windsurf";
const WS_APP_VER = process.env.WS_APP_VER || "1.48.2";
const WS_LS_VER = process.env.WS_LS_VER || "1.9544.35";

// ─── 内存 JWT 缓存 (避免重复握手) ───
const _jwtCache = new Map();

function _getJwtExp(jwt) {
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return 0;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    return payload.exp || 0;
  } catch {
    return 0;
  }
}

function _buildMetadata(apiKey, jwt) {
  const meta = new ProtobufEncoder();
  meta.writeString(1, WS_APP);
  meta.writeString(2, WS_APP_VER);
  meta.writeString(3, apiKey);
  meta.writeString(4, "en");

  const plat = platform();
  meta.writeString(5, JSON.stringify({
    Os: plat, Arch: arch(), Release: release(), Version: osVersion(),
    Machine: arch(), Nodename: hostname(),
    Sysname: plat === "darwin" ? "Darwin" : plat === "win32" ? "Windows_NT" : "Linux",
    ProductVersion: "",
  }));
  meta.writeString(7, WS_LS_VER);

  const cpuList = cpus();
  meta.writeString(8, JSON.stringify({
    NumSockets: 1, NumCores: cpuList.length, NumThreads: cpuList.length,
    VendorID: "", Family: "0", Model: "0",
    ModelName: cpuList[0]?.model || "Unknown", Memory: totalmem(),
  }));
  meta.writeString(12, WS_APP);
  meta.writeString(21, jwt);
  meta.writeBytes(30, Buffer.from([0x00, 0x01]));
  return meta;
}

/**
 * 获取并缓存 JWT 令牌
 */
export async function getCachedJwt(apiKey) {
  const now = Math.floor(Date.now() / 1000);
  const cached = _jwtCache.get(apiKey);
  if (cached && cached.expiresAt > now + 60) return cached.token;

  const meta = new ProtobufEncoder();
  meta.writeString(1, WS_APP);
  meta.writeString(2, WS_APP_VER);
  meta.writeString(3, apiKey);
  meta.writeString(4, "en");
  meta.writeString(7, WS_LS_VER);
  meta.writeString(12, WS_APP);
  meta.writeBytes(30, Buffer.from([0x00, 0x01]));

  const outer = new ProtobufEncoder();
  outer.writeMessage(1, meta);

  const resp = await fetch(`${AUTH_BASE}/GetUserJwt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/proto",
      "Connect-Protocol-Version": "1",
      "User-Agent": "connect-go/1.18.1 (go1.25.5)",
      "Accept-Encoding": "gzip",
    },
    body: outer.toBuffer(),
    signal: AbortSignal.timeout(20000),
  });

  if (!resp.ok) throw new Error(`获取凭证失败 HTTP ${resp.status}，请检查 Devin 登录状态或重新提取 Key。`);

  const buf = Buffer.from(await resp.arrayBuffer());
  for (const s of extractStrings(buf)) {
    if (s.startsWith("eyJ") && s.includes(".")) {
      _jwtCache.set(apiKey, { token: s, expiresAt: _getJwtExp(s) || now + 3600 });
      return s;
    }
  }
  throw new Error("未能从服务端响应中解析出有效凭证。");
}

/**
 * 极简 Protobuf 解码器：返回 [{ field, wire, value }]
 */
export function parseProto(data) {
  const out = [];
  let i = 0;
  while (i < data.length) {
    let tag = 0, shift = 0;
    while (i < data.length) {
      const b = data[i++];
      tag |= (b & 0x7f) << shift;
      shift += 7;
      if (!(b & 0x80)) break;
    }
    const field = tag >>> 3;
    const wire = tag & 0x7;

    if (wire === 0) {
      let val = 0; shift = 0;
      while (i < data.length) {
        const b = data[i++];
        val |= (b & 0x7f) << shift;
        shift += 7;
        if (!(b & 0x80)) break;
      }
      out.push({ field, wire, value: val });
    } else if (wire === 2) {
      let len = 0; shift = 0;
      while (i < data.length) {
        const b = data[i++];
        len |= (b & 0x7f) << shift;
        shift += 7;
        if (!(b & 0x80)) break;
      }
      out.push({ field, wire, value: data.subarray(i, i + len) });
      i += len;
    } else if (wire === 1) i += 8;
    else if (wire === 5) i += 4;
    else break;
  }
  return out;
}

/**
 * 调用 Devin 原生全网检索 RPC (GetWebSearchResults)
 * 纯网关检索，无任何大模型推理开销，亚秒级响应
 */
export async function nativeWebSearch(apiKey, jwt, query, timeoutMs = 25000) {
  const searchWeb = new ProtobufEncoder();
  searchWeb.writeString(1, query);

  const req = new ProtobufEncoder();
  req.writeMessage(1, _buildMetadata(apiKey, jwt));
  req.writeMessage(2, searchWeb);

  const resp = await fetch(`${API_BASE}/GetWebSearchResults`, {
    method: "POST",
    headers: {
      "Content-Type": "application/proto",
      "Connect-Protocol-Version": "1",
      "User-Agent": "connect-go/1.18.1 (go1.25.5)",
      "Accept-Encoding": "gzip",
    },
    body: req.toBuffer(),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!resp.ok) {
    throw new Error(`官方检索网关返回异常 HTTP ${resp.status}`);
  }

  const buf = Buffer.from(await resp.arrayBuffer());
  const topFields = parseProto(buf);

  const results = [];

  for (const f of topFields) {
    // field 1 为重复的结果条目
    if (f.field === 1 && f.wire === 2 && Buffer.isBuffer(f.value)) {
      const sub = parseProto(f.value);
      let url = "", title = "", snippet = "";

      for (const s of sub) {
        if (!Buffer.isBuffer(s.value)) continue;
        const text = s.value.toString("utf-8");
        if (s.field === 3) url = text;
        else if (s.field === 4) title = text;
        else if (s.field === 7) snippet = text;
      }

      if (url || title) {
        results.push({ url, title: title || url, snippet });
      }
    }
  }

  return results;
}
