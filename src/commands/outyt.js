const { ContainerBuilder, MessageFlags } = require("discord.js");
const { createTextCommand } = require("./helpers");

module.exports = createTextCommand({
    name: "outyt",
    imageKey: "outyt",
    description: "Send instructions to leave a YouTube family group.",
    permission: "admin",
    async execute(context) {
      const exampleContainer = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent("╭・ʚ ?  ɞ・วิธีออกจากกลุ่มครอบครัว Youtube\n︰หนึ่ง・ให้ลูกค้าเข้าลิงค์  https://families.google.com/\n︰สอง・จากนั้นเข้าสู่ระบบเมลที่จะออกจากกลุ่มครอบครัว\n︰สาม・จากนั้นให้กดสามขีดที่มุมบนซ้าย ☰\n︰สี่・กดออกจากครอบครัวได้เลย\n╰・ʚ เย้ ɞ・ เสร็จเรียบร้อย"))
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
