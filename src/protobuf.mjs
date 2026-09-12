/**
 * 精简版 Protobuf 编码器 + Connect-RPC 帧处理
 * 对齐 Windsurf / Devin 底层二进制协议，纯内存零依赖
 */

import { gzipSync, gunzipSync } from "node:zlib";

export class ProtobufEncoder {
  constructor() {
    this._chunks = [];
  }

  _varint(value) {
    const bytes = [];
    while (value > 0x7f) {
      bytes.push((value & 0x7f) | 0x80);
      value >>>= 7;
    }
    bytes.push(value & 0x7f);
    return Buffer.from(bytes);
  }

  _tag(field, wire) {
    return this._varint((field << 3) | wire);
  }

  writeVarint(field, value) {
    this._chunks.push(this._tag(field, 0), this._varint(value));
    return this;
  }

  writeString(field, value) {
    const data = Buffer.from(value, "utf-8");
    this._chunks.push(this._tag(field, 2), this._varint(data.length), data);
    return this;
  }

  writeBytes(field, value) {
    const buf = Buffer.isBuffer(value) ? value : Buffer.from(value);
    this._chunks.push(this._tag(field, 2), this._varint(buf.length), buf);
    return this;
  }

  writeMessage(field, sub) {
    const data = sub.toBuffer();
    this._chunks.push(this._tag(field, 2), this._varint(data.length), data);
    return this;
  }

  toBuffer() {
    return Buffer.concat(this._chunks);
  }
}

/**
 * 从 protobuf 二进制流中提取长度大于 5 的字符串
 */
export function extractStrings(data) {
  const strings = [];
  let i = 0;
  while (i < data.length) {
    let tag = 0;
    let shift = 0;
    while (i < data.length) {
      const b = data[i++];
      tag |= (b & 0x7f) << shift;
      shift += 7;
      if (!(b & 0x80)) break;
    }
    const wire = tag & 0x7;
    if (wire === 0) {
      while (i < data.length) {
        const b = data[i++];
        if (!(b & 0x80)) break;
      }
    } else if (wire === 1) {
      i += 8;
    } else if (wire === 2) {
      let length = 0;
      shift = 0;
      while (i < data.length) {
        const b = data[i++];
        length |= (b & 0x7f) << shift;
        shift += 7;
        if (!(b & 0x80)) break;
      }
      if (i + length <= data.length) {
        const raw = data.subarray(i, i + length);
        try {
          const text = raw.toString("utf-8");
          if (text.length > 5) strings.push(text);
        } catch {}
      }
      i += length;
    } else if (wire === 5) {
      i += 4;
    } else {
      break;
    }
  }
  return strings;
}

export function connectFrameEncode(protoBytes, compress = true) {
  let payload;
  let flags;
  if (compress) {
    payload = gzipSync(protoBytes);
    flags = 1;
  } else {
    payload = protoBytes;
    flags = 0;
  }
  const header = Buffer.alloc(5);
  header[0] = flags;
  header.writeUInt32BE(payload.length, 1);
  return Buffer.concat([header, payload]);
}

export function connectFrameDecode(data) {
  const frames = [];
  let i = 0;
  while (i + 5 <= data.length) {
    const flags = data[i];
    const length = data.readUInt32BE(i + 1);
    i += 5;
    let payload = data.subarray(i, i + length);
    i += length;
    if (flags === 1 || flags === 3) {
      try {
        payload = gunzipSync(payload);
      } catch {}
    }
    frames.push(Buffer.from(payload));
  }
  return frames;
}
