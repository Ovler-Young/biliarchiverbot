import { Telegraf } from "telegraf";
import { BiliArchiver } from "./api";
import Bvid from "./bv";
import resolveB23 from "./b23";
import * as MARKUP from "./markup";
require('dotenv').config()

const token = process.env.BILIARCHIVER_BOT;
if (!token) {
  console.error("\x1b[31mBOT_TOKEN must be provided!\x1b[0m");
  process.exit(1);
}
const bot = new Telegraf(token);
const apiBase = process.env.BILIARCHIVER_API;
if (!apiBase) {
  throw new Error("\x1b[31mBILIARCHIVER_API must be provided!\x1b[0m");
}
const api = new BiliArchiver(new URL(apiBase));

bot.command("start", Telegraf.reply("向我发送 BV 号以存档视频。"));
bot.help((ctx) => ctx.reply("向我发送 BV 号以存档视频。我会进行正则匹配。"));

bot.command("bili", async (ctx) => {
  // if (ctx.chat.id !== -1001773704746) {
  //   return;
  // }
  let text = ctx.message.text;
  // @ts-ignore
  console.info(ctx.message.reply_to_message);
  // @ts-ignore
  if (ctx.message.reply_to_message && ctx.message.reply_to_message["text"]) {
    // @ts-ignore
    text = ctx.message.reply_to_message["text"] + "\n" + text;
  }
  // console.log(ctx.message);
  const urls: string[] = [];

  ctx.message.entities?.forEach((entity) => {
    if (entity.type === "text_link" && entity.url) {
      urls.push(entity.url);
    }
  });

  text = urls.join(" ") + text;
  text = await resolveB23(text);
  const matches = /BV[a-zA-Z0-9]+/i.exec(text);
  if (!matches) {
    return;
  }
  const bv = new Bvid(matches[0]);
  console.log("Found", ctx.chat.id, ctx.message.text);
  let pending;
  try {
    pending = await ctx.reply("正在发送请求……", {
      reply_to_message_id: ctx.message.message_id,
    });
  } catch (e) {
    return;
  }

  const success = await api.add(bv);

  const reply_markup =
    ctx.chat.type === "private" ? MARKUP.MINIAPP_PRIVATE : MARKUP.MINIAPP;

  (async () => {
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    for (let i = 0; i < 30; i++) {
      await sleep(28000 + 4500 * i);
      const result = await api.check(bv);
      if (result.isSome()) {
        try {
          const url = result.unwrap().toString();
          await ctx.reply(
            `\u{1F389} Archive of ${bv} was done, item uploaded to
${url}`,
            {
              reply_to_message_id: ctx.message.message_id,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "View archived",
                      url,
                    },
                  ],
                ],
              },
            }
          );
        } catch (e) {}
        return;
      }
    }
  })();
  (async () => {
    try {
      ctx.deleteMessage(pending.message_id);
      if (success) {
        await ctx.reply(`Archive request ${bv} was successfully sent.`, {
          reply_to_message_id: ctx.message.message_id,
          reply_markup,
        });
      } else {
        await ctx.reply(`Archive request ${bv} failed.`, {
          reply_to_message_id: ctx.message.message_id,
          reply_markup,
        });
      }
    } catch (e) {
      return;
    }
  })();
});

bot.command("bilist", async (ctx) => {
  const queue = await api.queue();
  const text = queue.length
    ? `**${queue.length} items in queue pending or archiving:**
${queue.join("\n")}`
    : "**All items in queue has been archived**";
  const reply_markup =
    ctx.chat.type === "private" ? MARKUP.MINIAPP_PRIVATE : MARKUP.MINIAPP;
  await ctx.replyWithMarkdownV2(text, {
    reply_to_message_id: ctx.message.message_id,
    reply_markup,
  });
});

console.log("Start running…");
bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
