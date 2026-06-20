import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { getRedis } from "../redis.js";

const FAV_KEY_PREFIX = "convertbuddy:favs:";

function favKey(userId: number): string {
  return `${FAV_KEY_PREFIX}${userId}`;
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
      await ctx.reply("You have no favorites yet. Add some with /fav <from>:<to>");
      return;
    }

    const list = (members as string[]).sort().join("\n");
    await ctx.reply(`Your favorites:\n${list}`);
  } catch {
    await ctx.reply("Failed to retrieve favorites.");
  }
});

export default composer;