const { ContainerBuilder, MessageFlags } = require("discord.js");
const { createTextCommand } = require("./helpers");

module.exports = createTextCommand({
    name: "otp",
    imageKey: "otp",
    description: "Send OTP instructions.",
    permission: "admin",
    async execute(context) {
      const exampleContainer = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent("การรับ OTP ต้องบอกว่าจะรับก่อนแล้วห้ามกด Login เลยทันที ต้องรอให้ทีมงานของเราบอกว่า Login ได้ก่อน มิเช่นนั้น Otp จะไม่ส่งมา\n<:bag:916912869839351858>  รอสักครู่ก่อนนะครับ <:bag:916912869839351858>\nโปรดส่งเบอร์ทิ้งไว้ที่นี่ เพื่อความสะดวกของแอดมินครับ ขอบคุณครับ <a:ap_catlove1702701537155088414:874539670527176764>"))
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
