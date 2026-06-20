import { createRequire } from "node:module";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _redisClient: any = null;

function createMemoryClient() {
  const sets = new Map<string, Set<string>>();
  const strings = new Map<string, string>();
  return {
    scard: async (key: string) => {
      const s = sets.get(key);
      return s ? s.size : 0;
    },
    sadd: async (key: string, ...members: string[]) => {
      let s = sets.get(key);
      if (!s) {
        s = new Set<string>();
        sets.set(key, s);
      }
      let added = 0;
      for (const m of members) {
        if (!s.has(m)) {
          s.add(m);
          added++;
        }
      }
      return added;
    },
    srem: async (key: string, ...members: string[]) => {
      const s = sets.get(key);
      if (!s) return 0;
      let removed = 0;
      for (const m of members) {
        if (s.delete(m)) removed++;
      }
      if (s.size === 0) sets.delete(key);
      return removed;
    },
    smembers: async (key: string) => {
      const s = sets.get(key);
      return s ? [...s] : [];
    },
    get: async (key: string): Promise<string | null> => {
      return strings.has(key) ? (strings.get(key) as string) : null;
    },
    set: async (key: string, value: string): Promise<string> => {
      strings.set(key, value);
      return value;
    },
    del: async (key: string): Promise<number> => {
      const existed = strings.has(key);
      strings.delete(key);
      return existed ? 1 : 0;
    },
    keys: async (pattern: string): Promise<string[]> => {
      const glob = pattern.replace(/\*/g, ".*").replace(/\?/g, ".");
      const re = new RegExp(`^${glob}$`);
      return [...strings.keys()].filter((k) => re.test(k));
    },
  };
}

export function getRedis() {
  if (_redisClient) return _redisClient;

  const url = process.env.REDIS_URL;
  if (url) {
    try {
      const req = createRequire(import.meta.url);
      const ioredis = req("ioredis");
      const Redis = ioredis.default ?? ioredis.Redis ?? ioredis;
      const client = new Redis(url, {
        maxRetriesPerRequest: null,
        lazyConnect: false,
        retryStrategy() {
          return null;
        },
        connectTimeout: 3000,
      });

      const fallback = createMemoryClient();
      _redisClient = fallback;

      client.on("error", () => {
        _redisClient = fallback;
      });

      return _redisClient;
    } catch {
      _redisClient = createMemoryClient();
      return _redisClient;
    }
  }

  _redisClient = createMemoryClient();
  return _redisClient;
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
