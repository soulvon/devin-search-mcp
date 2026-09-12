/**
 * 轻量级搜索缓存模块
 * 支持内存缓存与基于 TTL 的自动失效机制
 */

import { createHash } from "node:crypto";

class SimpleCache {
  constructor(defaultTtlMs = 30 * 60 * 1000) {
    this.cache = new Map();
    this.defaultTtlMs = defaultTtlMs;
  }

  generateKey(namespace, query, options = {}) {
    const raw = `${namespace}:${query}:${JSON.stringify(options)}`;
    return createHash("md5").update(raw).digest("hex");
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expireAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    // 限制最大缓存数量为 100 条
    if (this.cache.size >= 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expireAt: Date.now() + ttlMs,
    });
  }

  clear() {
    this.cache.clear();
  }
}

export const searchCache = new SimpleCache();
