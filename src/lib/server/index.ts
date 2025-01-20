import { Bot, webhookCallback, Context, GrammyError, HttpError } from "grammy";
import { BiliArchiver } from "./api.js";
import * as MARKUP from "./markup.js";
import { isAdmin, addAdmin, listAdmins } from "./admin.ts";
import { isBlacklisted, addToBlacklist } from "./blacklist.ts";
import { env } from "$env/dynamic/private";
import { autoQuote } from "@roziscoding/grammy-autoquote";
import { autoRetry } from "@grammyjs/auto-retry";
import { handleBiliLink } from "./utils.js";

const token = env.BILIARCHIVER_BOT;
if (!token) {
  console.error("\x1b[31mBOT_TOKEN must be provided!\x1b[0m");
}
const bot = new Bot(token!);
bot.use(autoQuote());
bot.api.config.use(autoRetry());
const apiBase = env.BILIARCHIVER_API;
if (!apiBase) {
  throw new Error("\x1b[31mBILIARCHIVER_API must be provided!\x1b[0m");
}
const api = new BiliArchiver(new URL(apiBase));

bot.command("start", (ctx) =>
  ctx.reply(
    "向我发送 <code>/bili</code> 命令并跟随视频链接，我会进行正则匹配。\n" +
      "查询存档队列请使用 <code>/bilist</code> 命令。\n",
    {
      parse_mode: "HTML",
    }
  )
);
bot.command("help", (ctx) =>
  ctx.reply(
    "向我发送 <code>/bili</code> 命令并跟随视频链接，我会进行正则匹配。\n" +
      "查询存档队列请使用 <code>/bilist</code> 命令。\n",
    {
      parse_mode: "HTML",
    }
  )
);

bot.use(async (ctx, next) => {
  if (env.BILIARCHIVER_ENABLE_BLACKLIST !== "true") {
    return next();
  }
  if (ctx.from && isBlacklisted(ctx.from.id)) {
    const Admins = listAdmins();
    const adminMentions = Admins.map(
      (id) => `[${id}](tg://user?id=${id})`
    ).join("; ");
    await ctx.reply(
      `You have been blacklisted from using this bot, ` +
        `If you think this is a mistake, please contact admins: ` +
        adminMentions,
      { parse_mode: "MarkdownV2" }
    );
    return;
  }
  return next();
});

bot.command("bili", async (ctx) => {
  await handleBiliLink(ctx);
});
bot.hears(
  /(BV[a-zA-Z0-9]+)|(av\d+)|(bili2233.cn|b23\.(tv|wtf))\/\S+|www\.bilibili\.com\/(video|medialist|list)\/\S+|space\.bilibili\.com\/\d+/i,
  async (ctx) => {
    await handleBiliLink(ctx);
  }
);

bot.command("bilist", async (ctx) => {
  const queue = await api.queue();
  const text = queue.length
    ? `**${queue.length} items in queue pending or archiving:**\n${
        queue.length > 10
          ? queue.slice(0, 10).join("\n") +
            "\nAnd " +
            (queue.length - 10) +
            " more"
          : queue.join("\n")
      }`
    : "**All items in queue have been archived**";
  const reply_markup =
    ctx.chat.type === "private" ? MARKUP.MINIAPP_PRIVATE : MARKUP.MINIAPP;
  await ctx.reply(text, {
    // reply_parameters: ctx.message.message_id,
    parse_mode: "MarkdownV2",
    reply_markup,
  });
});
bot.command("addadmin", async (ctx) => {
  if (env.BILIARCHIVER_ENABLE_BLACKLIST !== "true") {
    await ctx.reply("Admin functionality is not enabled");
    return;
  }
  const senderId = ctx.from?.id;
  if (!senderId) return;

  const targetId = Number(ctx.match);

  if (!isAdmin(senderId)) {
    if (listAdmins().length === 0) {
      // First admin
      addAdmin(senderId);
      await ctx.reply("You are now the first admin.");
    }
    return;
  }

  if (!targetId || isNaN(targetId)) {
    await ctx.reply("Please provide a valid user ID");
    return;
  }

  addAdmin(targetId);
  await ctx.reply(`Added ${targetId} as admin.`);
});

bot.command("blacklist", async (ctx) => {
  if (env.BILIARCHIVER_ENABLE_BLACKLIST !== "true") {
    await ctx.reply("Blacklist functionality is not enabled");
    return;
  }

  if (!ctx.from || !isAdmin(ctx.from.id)) {
    return;
  }

  const userId = Number(ctx.match);
  if (isNaN(userId)) {
    await ctx.reply("Invalid user ID");
    return;
  }

  addToBlacklist(userId);
  await ctx.reply(`User ${userId} has been blacklisted.`);
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

export default bot;
