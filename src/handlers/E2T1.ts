import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { UNITS } from "./convert.js";
import { getRedis } from "../redis.js";

const MAX_FAVORITES = 100;
const FAV_KEY_PREFIX = "convertbuddy:favs:";

function favKey(userId: number): string {
  return `${FAV_KEY_PREFIX}${userId}`;
}

const composer = new Composer<Ctx>();

composer.command("fav", async (ctx) => {
  const text = ctx.message?.text ?? "";
  const parts = text.trim().split(/\s+/);

  if (parts.length < 2) {
    await ctx.reply("Usage: /fav <from>:<to>\nExample: /fav km:miles");
    return;
  }

  const favPair = parts[1];
  if (!favPair.includes(":")) {
    await ctx.reply("Format: <from>:<to>\nExample: /fav km:miles");
    return;
  }

  const colonIdx = favPair.indexOf(":");
  const fromPart = favPair.slice(0, colonIdx).trim();
  const toPart = favPair.slice(colonIdx + 1).trim();

  if (!fromPart || !toPart) {
    await ctx.reply("Format: <from>:<to>\nExample: /fav km:miles");
    return;
  }

  const fromUnit = fromPart.toLowerCase();
  const toUnit = toPart.toLowerCase();
  const normalizedPair = `${fromUnit}:${toUnit}`;

  const fromDef = UNITS[fromUnit];
  const toDef = UNITS[toUnit];

  if (!fromDef) {
    await ctx.reply(`Unknown unit: "${fromUnit}". Try /fav km:miles`);
    return;
  }
  if (!toDef) {
    await ctx.reply(`Unknown unit: "${toUnit}". Try /fav km:miles`);
    return;
  }
  if (fromDef.category !== toDef.category) {
    await ctx.reply(
      `Cannot favorite "${fromUnit}" (${fromDef.category}) with "${toUnit}" (${toDef.category}). Units must be of the same type.`,
    );
    return;
  }

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
    const count = await redis.scard(key);
    if (count >= MAX_FAVORITES) {
      await ctx.reply(
        `You have reached the maximum of ${MAX_FAVORITES} favorites. Remove some with /delfav first.`,
      );
      return;
    }

    const added = await redis.sadd(key, normalizedPair);
    if (added > 0) {
      await ctx.reply(`Favorite added: ${normalizedPair}`);
    } else {
      await ctx.reply(`"${normalizedPair}" is already in your favorites.`);
    }
  } catch {
    await ctx.reply("Failed to save favorite.");
  }
});

export default composer;