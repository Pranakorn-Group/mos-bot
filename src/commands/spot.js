const { ContainerBuilder, MessageFlags } = require("discord.js");
const { createTextCommand } = require("./helpers");

module.exports = createTextCommand({
    name: "spot",
    imageKey: "spot",
    description: "Send Spotify usage rules.",
    permission: "admin",
    async execute(context) {
      const exampleContainer = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent("**โปรดอ่านให้ละเอียดครบถ้วนก่อนการใช้งาน**\n\nขอความร่วมมือคุณลูกค้า ปิด Location / GPS หรืออะไรก็ตามที่เกี่ยวข้อง (ทั้งตัวเครื่องและตัวแอพ) ตลอดการใช้งานของลูกค้า เน้นย้ำว่า **ปิด GPS ตัวเครื่อง ตลอด การใช้งาน**\n\nหากหลุด Premium ทางร้านขออนุญาต**ปรับ 2,000 บาทนะครับ** และทางร้านจะไม่รับผิดชอบใดๆ ทั้งสิ้น\n\nหากมีข้อสงสัยในการปิด GPS หรือข้อสงสัยในการใช้งานใดๆ ทางร้าน P5SHOP ยินดีให้บริการเสมอนะครับ สามารถติดต่อสอบถามได้ทันที\n\nขอบคุณที่ใช้บริการครับ"))
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
