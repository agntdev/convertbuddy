import { Composer } from "grammy";
import { createRequire } from "node:module";
import type { Ctx } from "../bot.js";

const FAV_KEY_PREFIX = "favs:";

function favKey(userId: number): string {
  return `${FAV_KEY_PREFIX}${userId}`;
}

let redisClient: {
  smembers(key: string): Promise<string[]>;
} | null = null;

function getRedis() {
  if (redisClient) return redisClient;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    const req = createRequire(import.meta.url);
    const ioredis = req("ioredis");
    const Redis = ioredis.default ?? ioredis.Redis ?? ioredis;
    redisClient = new Redis(url, { maxRetriesPerRequest: null, lazyConnect: false });
    return redisClient;
  } catch {
    return null;
  }
}

const composer = new Composer<Ctx>();

composer.command("favs", async (ctx) => {
  const redis = getRedis();
  if (!redis) {
    await ctx.reply("Favorites storage is not available.");
    return;
  }

  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("Could not identify user.");
    return;
  }

  const key = favKey(userId);

  try {
    const members = await redis.smembers(key);
    if (!members || members.length === 0) {
      await ctx.reply("You have no favorites yet. Add some with /addfav <from>:<to>");
      return;
    }

    const list = (members as string[]).sort().join("\n");
    await ctx.reply(`Your favorites:\n${list}`);
  } catch {
    await ctx.reply("Failed to retrieve favorites.");
  }
});

export default composer;