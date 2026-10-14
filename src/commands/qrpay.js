const { ContainerBuilder, MessageFlags } = require("discord.js");
const { createTextCommand, parseAmount } = require("./helpers");

module.exports = createTextCommand({
    name: "qrpay",
    imageKey: "qrpay",
    description: "Generate a PromptPay URL.",
    permission: "admin",
    options: [
      {
        name: "amount",
        description: "Payment amount",
        required: true,
        type: "number"
      }
    ],
    async execute(context) {
      const amount = parseAmount(context, "amount", 0, "Please provide an amount.");
      const exampleContainer = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addMediaGalleryComponents((gallery) => gallery.addItems({ media: { url: `https://promptpay.io/0653192342/${amount}` } }))
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`แสกน QR PromptPay เพื่อชำระเงินจำนวน **${amount}** บาท`))
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
