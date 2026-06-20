import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { menuKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

composer.command("start", async (ctx) => {
  await ctx.reply("Welcome! I am ready to help.", {
    reply_markup: menuKeyboard([
      { text: "Convert", data: "menu:convert" },
      { text: "Favorites", data: "menu:favs" },
      { text: "Help", data: "menu:help" },
    ]),
  });
});

export default composer;
