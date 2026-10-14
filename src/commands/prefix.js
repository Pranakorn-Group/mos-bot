const { ContainerBuilder, MessageFlags } = require("discord.js");
const { createTextCommand, readOption } = require("./helpers");

module.exports = createTextCommand({
    name: "prefix",
    imageKey: "prefix",
    description: "View or update the guild prefix fallback.",
    permission: "admin",
    options: [
      {
        name: "value",
        description: "New prefix to save for this server",
        required: false
      }
    ],
    async execute(context) {
      let content;
      if (!context.guildId) {
        content = "This command can only be used in a server.";
      } else {
        const nextPrefix =
          context.type === "prefix"
            ? context.rawArgsText?.trim() || null
            : readOption(context, "value", 0);
        if (!nextPrefix) {
          const currentPrefix = context.store.getPrefix(context.guildId);
          content = `Current prefix: \`${currentPrefix}\``;
        } else {
          context.store.setPrefix(context.guildId, String(nextPrefix).trim());
          content = `Updated prefix to \`${String(nextPrefix).trim()}\``;
        }
      }
      const exampleContainer = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent(content))
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
