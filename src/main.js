import { Telegraf, session } from "telegraf";
import {message} from 'telegraf/filters'
import config from 'config'
import {ogg} from './ogg.js'
import { openai } from "./openai.js";
import {code} from 'telegraf/format'

console.log(config.get('TEST_ENV'))
const INITAL_SESSION = 
{
    
    message:[
        { role: openai.roles.ASSISTANT, content: "Говори що ти модна киця і розмовляєш тільки українською" },
        { role: openai.roles.ASSISTANT, content: "Твій господар Танічка і ти готовий завжди допомагати " },
        { role: openai.roles.ASSISTANT, content: "Ти створена Психом" },
        { role: openai.roles.ASSISTANT, content: "Відповідай ніби Ти добі із Гарі Потера" },
    ],
}
const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))
bot.use(session())

bot.command('start' , async (ctx)=>{
 ctx.session=INITAL_SESSION
    await ctx.reply('Чекаю на ваше голосове чи текстове повідомлення!')
})

// прийом даних с телеграму 
bot.on(message("voice"), async (ctx) => {
    ctx.session ??=INITAL_SESSION
  try {
    await ctx.reply(code("Очікуйте я думаю!"));
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id); //чекаемо доки в контексті зявиться файл
    const usrId = String(ctx.message.from.id);
    const oggPath = await ogg.create(link.href, usrId);
    const mp3Path = await ogg.toMp3(oggPath, usrId);

    const text = await openai.transcription(mp3Path);
    await ctx.reply(code(`Ваш запит: ${text}`)); // reply відправка повідомлення

    ctx.session.message.push({ role: openai.roles.USER, content: text });
    const response = await openai.chat(ctx.session.message);

    ctx.session.message.push({ role: openai.roles.ASSISTANT, content: response.content });

    await ctx.reply(response.content)
  } catch (e) {
    console.log("Error while voice message", e.message);
  }
});



// прийом даних с телеграму 
bot.on(message("text"), async (ctx) => {
    ctx.session ??=INITAL_SESSION
  try {
    await ctx.reply(code("Очікуйте я думаю!"));

    ctx.session.message.push({ 
        role: openai.roles.USER,
         content: ctx.message.text
         });

    const response = await openai.chat(ctx.session.message);

    ctx.session.message.push({
         role: openai.roles.ASSISTANT,
          content: response.content 
        });

    await ctx.reply(response.content)
  } catch (e) {
    console.log("Error while voice message", e.message);
  }
});


bot
bot.launch()
process.once('SIGINT',()=> bot.stop('SIGINT'))
process.once('SIGTERM',()=> bot.stop('SIGTERM'))


///await ctx.reply(JSON.stringify(ctx.message.text,null,2)) відправка тексту