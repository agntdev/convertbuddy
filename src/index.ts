import { buildBot } from "./bot.js";
import { disconnectRedis } from "./redis.js";

async function main() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error("BOT_TOKEN is required");
    process.exit(1);
  }
  const bot = await buildBot(token);

  const shutdown = async () => {
    await bot.stop();
    await disconnectRedis();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  bot.start();
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
