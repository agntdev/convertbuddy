import { createRequire } from "node:module";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _redisClient: any = null;

export function getRedis() {
  if (_redisClient) return _redisClient;
  const url = process.env.REDIS_URL;
  if (!url) return null;
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
