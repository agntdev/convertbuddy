import { createRequire } from "node:module";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _redisClient: any = null;

function simpleGlob(pattern: string, key: string): boolean {
  if (pattern === "*") return true;
  let pi = 0;
  let ki = 0;
  while (pi < pattern.length) {
    if (pattern[pi] === "*") {
      pi++;
      if (pi === pattern.length) return true;
      while (ki < key.length && !simpleGlob(pattern.slice(pi), key.slice(ki))) ki++;
      return ki < key.length;
    }
    if (pattern[pi] === "?") {
      pi++;
      ki++;
      if (ki > key.length) return false;
      continue;
    }
    if (ki >= key.length || pattern[pi] !== key[ki]) return false;
    pi++;
    ki++;
  }
  return ki === key.length;
}

class MemoryRedisClient {
  private store = new Map<string, Set<string> | string>();

  async scard(key: string): Promise<number> {
    const set = this.store.get(key);
    if (!set || typeof set === "string") return 0;
    return set.size;
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    let set = this.store.get(key);
    if (!set || typeof set === "string") {
      set = new Set<string>();
      this.store.set(key, set);
    }
    let added = 0;
    for (const m of members) {
      if (!set.has(m)) {
        set.add(m);
        added++;
      }
    }
    return added;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const set = this.store.get(key);
    if (!set || typeof set === "string") return 0;
    let removed = 0;
    for (const m of members) {
      if (set.delete(m)) removed++;
    }
    return removed;
  }

  async smembers(key: string): Promise<string[]> {
    const set = this.store.get(key);
    if (!set || typeof set === "string") return [];
    return [...set];
  }

  async get(key: string): Promise<string | null> {
    const val = this.store.get(key);
    if (val === undefined || typeof val !== "string") return null;
    return val;
  }

  async set(key: string, value: string): Promise<"OK"> {
    this.store.set(key, value);
    return "OK";
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    const out: string[] = [];
    for (const key of this.store.keys()) {
      if (simpleGlob(pattern, key)) out.push(key);
    }
    return out;
  }
}

let _memoryClient: MemoryRedisClient | null = null;

export function getRedis() {
  if (_redisClient) return _redisClient;
  const url = process.env.REDIS_URL;
  if (!url) {
    if (!_memoryClient) _memoryClient = new MemoryRedisClient();
    return _memoryClient;
  }
  try {
    const req = createRequire(import.meta.url);
    const ioredis = req("ioredis");
    const Redis = ioredis.default ?? ioredis.Redis ?? ioredis;
    _redisClient = new Redis(url, { maxRetriesPerRequest: null, lazyConnect: false });
    return _redisClient;
  } catch {
    if (!_memoryClient) _memoryClient = new MemoryRedisClient();
    return _memoryClient;
  }
}

export async function disconnectRedis() {
  if (_redisClient) {
    try {
      await (_redisClient as { quit?(): Promise<void> }).quit?.();
    } catch {
      // ignore disconnect errors
    }
    _redisClient = null;
  }
}
