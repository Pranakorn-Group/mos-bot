const { ContainerBuilder, MessageFlags } = require("discord.js");
const { createTextCommand } = require("./helpers");

module.exports = createTextCommand({
    name: "nf",
    imageKey: "nf",
    description: "Send Netflix rules.",
    permission: "admin",
    async execute(context) {
      const exampleContainer = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`✦ กรุณาอ่านก่อนเข้าใช้ NETFLIX P5 SHOP •₊˚。\n\n♡🔑 1จอ ต่อ1คน เป็นจอส่วนตัว ไม่มีการหารร่วม\n♡🖥️ เข้าใช้ทีละอุปกรณ์ ดูทีละเครื่อง\n♡🗝 ไม่อนุญาตให้นำไปแชร์หรือขายต่อ\n♡🔐 ตั้งรหัสพินเองได้เลย\n♡🪑 ห้ามเปลี่ยนรหัสเมล\n♡🧺 ห้ามเข้าใช้โปรไฟล์ของคนอื่น\n♡🔑 1 โปรไฟล์ ล็อคอินหลายเครื่องได้ แต่ต้องเปิดทีละเครื่อง\n♡🍂 แจ้งโปรไฟล์หลังการเปลื่ยนชื่อภายใน 24 ชม. หลังการสั่งซื้อ\n♡🌲 แจ้งต่อเมลก่อน 1-3 วันก่อนหมดอายุ [ บางแอคต่อไม่ได้ ]\n♡🧵 รับเคลมหากเข้าไม่ได้ ยกเว้นบล็อคโซน\n\n▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀`))
        .addSeparatorComponents((separator) => separator.setDivider(true));
      const imageUrl = context.commandImage?.url;
      const r2Base = context.config?.r2PublicUrl?.replace(/\/+$/, "");
      if (imageUrl && r2Base?.startsWith("https://") && imageUrl.startsWith(`${r2Base}/`)) {
        exampleContainer.addMediaGalleryComponents((gallery) => gallery.addItems({ media: { url: imageUrl } }));
      }
      const payload = { components: [exampleContainer], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [], repliedUser: false } };
      if (context.type === "slash") {
        if (context.interaction.deferred || context.interaction.replied) await context.interaction.followUp(payload);
        else await context.interaction.reply(payload);
      } else await context.message.channel.send(payload);
    }
  });
