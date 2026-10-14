const { ContainerBuilder, MessageFlags } = require("discord.js");
const { createTextCommand } = require("./helpers");

module.exports = createTextCommand({
    name: "ty",
    imageKey: "ty",
    description: "Send the thank-you message.",
    permission: "admin",
    async execute(context) {
      const exampleContainer = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent("<:netherstar:916933016662728765> ขอบคุณที่ใช้บริการ P5 SHOP นะครับ <:netherstar:916933016662728765>\nถ้าถูกใจ ฝากเครดิต <:credit:854305886306828289> ให้เราที่ <#997090728943558686> ด้วยนะครับ\nแล้วแวะมาอุดหนุนใหม่นะคร้าบบบ <:congrats:924517045696090152>\nถ้าไม่มีอะไรแล้ว กดปิด ticket โดยพิมพ์ $close ได้เลยครับผม <a:9420mcbeespin:916913018411757578>\n<a:bc7:855859841951465492> อย่าลืม Save ข้อความสินค้าไว้ก่อนจะปิด Ticket นะครับ"))
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
