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

composer.command("addfav", async (ctx) => {
  const redis = getRedis();
  if (!redis) {
    await ctx.reply("Favorites storage is not available.");
    return;
  }

  const text = ctx.message?.text ?? "";
  const parts = text.trim().split(/\s+/);

  if (parts.length < 2) {
    await ctx.reply("Usage: /addfav <from>:<to>\nExample: /addfav km:miles");
    return;
  }

  const favPair = parts[1];
  if (!favPair.includes(":")) {
    await ctx.reply("Format: <from>:<to>\nExample: /addfav km:miles");
    return;
  }

  const colonIdx = favPair.indexOf(":");
  const fromPart = favPair.slice(0, colonIdx).trim();
  const toPart = favPair.slice(colonIdx + 1).trim();

  if (!fromPart || !toPart) {
    await ctx.reply("Format: <from>:<to>\nExample: /addfav km:miles");
    return;
  }

  const fromUnit = fromPart.toLowerCase();
  const toUnit = toPart.toLowerCase();
  const normalizedPair = `${fromUnit}:${toUnit}`;

  const fromDef = UNITS[fromUnit];
  const toDef = UNITS[toUnit];

  if (!fromDef) {
    await ctx.reply(`Unknown unit: "${fromUnit}". Try /addfav km:miles`);
    return;
  }
  if (!toDef) {
    await ctx.reply(`Unknown unit: "${toUnit}". Try /addfav km:miles`);
    return;
  }
  if (fromDef.category !== toDef.category) {
    await ctx.reply(
      `Cannot favorite "${fromUnit}" (${fromDef.category}) with "${toUnit}" (${toDef.category}). Units must be of the same type.`,
    );
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

composer.command("delfav", async (ctx) => {
  const redis = getRedis();
  if (!redis) {
    await ctx.reply("Favorites storage is not available.");
    return;
  }

  const text = ctx.message?.text ?? "";
  const parts = text.trim().split(/\s+/);

  if (parts.length < 2) {
    await ctx.reply("Usage: /delfav <from>:<to>\nExample: /delfav km:miles");
    return;
  }

  const favPair = parts[1];

  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("Could not identify user.");
    return;
  }

  const key = favKey(userId);

  try {
    const removed = await redis.srem(key, favPair);
    if (removed > 0) {
      await ctx.reply(`Favorite removed: ${favPair}`);
    } else {
      await ctx.reply(`"${favPair}" was not in your favorites.`);
    }
  } catch {
    await ctx.reply("Failed to remove favorite.");
  }
});

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

composer.callbackQuery("menu:favs", async (ctx) => {
  const redis = getRedis();
  if (!redis) {
    await ctx.answerCallbackQuery({ text: "Favorites storage is not available." });
    return;
  }

  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.answerCallbackQuery({ text: "Could not identify user." });
    return;
  }

  const key = favKey(userId);

  try {
    const members = await redis.smembers(key);
    if (!members || members.length === 0) {
      await ctx.answerCallbackQuery({ text: "No favorites yet. Add some with /addfav <from>:<to>" });
      return;
    }
    const list = (members as string[]).sort().join(", ");
    await ctx.answerCallbackQuery({ text: `Favorites: ${list}` });
    await ctx.reply(`Your favorites:\n${(members as string[]).sort().join("\n")}`);
  } catch {
    await ctx.answerCallbackQuery({ text: "Failed to retrieve favorites." });
  }
});

composer.callbackQuery("menu:convert", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    "Usage: /convert <value> <from_unit> to <to_unit>\n" +
    "Example: /convert 100 km to miles",
  );
});

composer.callbackQuery("menu:help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    "Available commands:\n" +
    "/start — Start the bot\n" +
    "/convert — Convert units\n" +
    "/addfav — Add a favorite unit pair\n" +
    "/delfav — Remove a favorite unit pair\n" +
    "/favs — List your favorites\n" +
    "/help — Show this help message",
  );
});

export default composer;