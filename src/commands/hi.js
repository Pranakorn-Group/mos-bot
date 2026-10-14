const { ContainerBuilder, MessageFlags } = require("discord.js");
const { createTextCommand } = require("./helpers");

module.exports = createTextCommand({
    name: "hi",
    imageKey: "hi",
    description: "Send the P5 Shop greeting.",
    permission: "admin",
    async execute(context) {
      const exampleContainer = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`<:cashmoneycheck:916913842636865557> สวัสดีครับ P5 SHOP ยินดีให้บริการครับ <:cashmoneycheck:916913842636865557>\n<a:918153692128100412:919906823769825321>  แจ้งสื่งที่ต้องการได้เลยครับ <a:9420mcbeespin:916933018411757578>`))
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
