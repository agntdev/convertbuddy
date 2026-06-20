import { createRequire } from "node:module";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _redisClient: any = null;

interface InMemorySetClient {
  scard(key: string): Promise<number>;
  sadd(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  srem(key: string, ...members: string[]): Promise<number>;
}

function createInMemorySetClient(): InMemorySetClient {
  const sets = new Map<string, Set<string>>();

  function getSet(key: string): Set<string> {
    let s = sets.get(key);
    if (!s) {
      s = new Set<string>();
      sets.set(key, s);
    }
    return s;
  }

  return {
    async scard(key: string): Promise<number> {
      return getSet(key).size;
    },
    async sadd(key: string, ...members: string[]): Promise<number> {
      const s = getSet(key);
      let added = 0;
      for (const m of members) {
        if (!s.has(m)) {
          s.add(m);
          added++;
        }
      }
      return added;
    },
    async smembers(key: string): Promise<string[]> {
      return [...getSet(key)];
    },
    async srem(key: string, ...members: string[]): Promise<number> {
      const s = getSet(key);
      let removed = 0;
      for (const m of members) {
        if (s.delete(m)) removed++;
      }
      return removed;
    },
  };
}

let _inMemoryClient: InMemorySetClient | null = null;

export function getRedis() {
  if (_redisClient) return _redisClient;
  const url = process.env.REDIS_URL;
  if (!url) {
    if (!_inMemoryClient) _inMemoryClient = createInMemorySetClient();
    return _inMemoryClient;
  }
  try {
    const req = createRequire(import.meta.url);
    const ioredis = req("ioredis");
    const Redis = ioredis.default ?? ioredis.Redis ?? ioredis;
    _redisClient = new Redis(url, { maxRetriesPerRequest: null, lazyConnect: false });
    return _redisClient;
  } catch {
    return null;
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
