const { ContainerBuilder, MessageFlags } = require("discord.js");
const { createTextCommand, parseText } = require("./helpers");

module.exports = createTextCommand({
    name: "longyt",
    imageKey: "longyt",
    description: "Send long-form YouTube premium instructions.",
    permission: "admin",
    options: [
      {
        name: "head",
        description: "Headline or package name",
        required: true
      },
      {
        name: "email",
        description: "Customer email",
        required: true
      }
    ],
    async execute(context) {
      const head = parseText(context, "head", 0, "Please provide the headline.");
      const email = parseText(context, "email", 1, "Please provide the customer email.");

      const exampleContainer = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`❧────༺♢༻────☙\n╭・ YT PREMIUM ต่อเมล ( BY P5 SHOP ) ◝ ⊹\n︰หัวบ้าน ・ ${head}\n︰เมลลูกค้า・ ${email}\n︰สามารถไปกดรับ YT PREMIUM  ใน Gmail เพื่อเปิดใช้งานได้เลยนะครับ\n︰เเละเเจ้งทางร้านด้วยว่ารับหรือยัง\n︰หมดอายุ : 00/0/2565 [ ควรแจ้งต่อก่อน 1-3 วัน ]\n╰ ・ลิงค์สำหรับลูกค้าเข้ากลุ่มแจ้งต่อเมล https://line.me/R/ti/g/x_n9EkqyVM\n❧────༺♢༻────☙`))
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
