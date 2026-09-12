/**
 * 响应解析与容错修复模块
 * 借鉴 fast-context-mcp 的模型输出深度解析与括号平衡修复能力
 */

/**
 * 修复常见畸形或截断的 JSON 文本
 */
export function repairJson(raw) {
  if (!raw || typeof raw !== "string") return null;

  let text = raw.trim();

  // 1. 去除代码块包裹
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    text = codeBlockMatch[1].trim();
  }

  // 2. 找到第一个有效起始符号 '[' 或 '{'
  const firstBracket = text.indexOf("[");
  const firstBrace = text.indexOf("{");
  let startIdx = -1;
  let expectType = "";

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    startIdx = firstBracket;
    expectType = "array";
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
    expectType = "object";
  }

  if (startIdx === -1) return null;
  text = text.slice(startIdx);

  // 3. 统计括号深度并补全缺失闭合
  const stack = [];
  let inString = false;
  let escapeNext = false;
  let validEnd = text.length;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{" || char === "[") {
      stack.push(char);
    } else if (char === "}") {
      if (stack[stack.length - 1] === "{") {
        stack.pop();
        if (stack.length === 0) {
          validEnd = i + 1;
          break;
        }
      }
    } else if (char === "]") {
      if (stack[stack.length - 1] === "[") {
        stack.pop();
        if (stack.length === 0) {
          validEnd = i + 1;
          break;
        }
      }
    }
  }

  let slice = text.slice(0, validEnd);

  // 补齐字符串引号
  if (inString) {
    slice += '"';
  }

  // 补齐末尾闭合括号
  while (stack.length > 0) {
    const top = stack.pop();
    slice += top === "{" ? "}" : "]";
  }

  // 移除数组或对象末尾的多余逗号
  slice = slice.replace(/,\s*([}\]])/g, "$1");

  return slice;
}

/**
 * 健壮的 JSON 解析器，先原生解析，失败则尝试修复
 */
export function parseJsonWithRepair(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const repaired = repairJson(raw);
    if (!repaired) return null;
    try {
      return JSON.parse(repaired);
    } catch {
      return null;
    }
  }
}
