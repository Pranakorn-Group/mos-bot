const { ContainerBuilder, MessageFlags } = require("discord.js");
const { createTextCommand } = require("./helpers");

module.exports = createTextCommand({
    name: "inyt",
    imageKey: "inyt",
    description: "Send YouTube invitation instructions.",
    permission: "admin",
    async execute(context) {
      const exampleContainer = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`<:YT05:922359969016324107> วิธีการตอบรับคำเชิญ Youtube [ BY P5 SHOP ]\n1. เข้าแอพ Gmail / เว็บ Gmail\n2. จะมีลิงก์ของยูทูปส่งไป\n3. จิ้มลิงก์ ➤ เลื่อนลงมา\n4. กด ACCEPT INVITATION\n5. กด GET STARTED\n6. เลือกเมลให้ตรงกับที่ให้ทางร้านมา\n7. กด MORE\n8. กด JOIN FAMILY\n9. กด VIEW FAMILY\n10. กด เรียบร้อยแล้ว เข้าใช้งานในแอพได้เลย ถ้าเข้าแอพแล้วยังไม่เป็น Premium ให้รีแอปทีหนึ่งครับ`))
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
