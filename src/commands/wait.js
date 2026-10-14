const { ContainerBuilder, MessageFlags } = require("discord.js");
const { createTextCommand, ensureValue, parseText } = require("./helpers");

module.exports = createTextCommand({
    name: "wait",
    imageKey: "wait",
    description: "Send the order wait message.",
    permission: "admin",
    options: [
      {
        name: "duration",
        description: "Expected delivery time",
        required: true
      }
    ],
    async execute(context) {
      const duration =
        context.type === "prefix"
          ? ensureValue(context.rawArgsText, "Please provide the expected duration.")
          : parseText(context, "duration", 0, "Please provide the expected duration.");
      const exampleContainer = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`↷ ︶꒷₊˚ <:cashmoneycheck:916913842636865557> รับออเดอร์เรียบร้อยครับ ๑ ‧ ₊ *\n\n⊹₊꒷︶꒷ <a:wait:929921846512611368> โดยปกติสินค้าใช้เวลาจัดส่งไม่เกิน ${duration} ครับผม ꒷︶꒷꒦\n\n༺ ⋆ 𓈒 ♱ ขอบคุณที่ใช้บริการ P5 SHOP คร้าบ ♱ 𓈒 ⋆ ༻`))
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
