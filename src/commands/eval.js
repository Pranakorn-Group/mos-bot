const { ContainerBuilder, MessageFlags } = require("discord.js");
const {
  buildEvalEmbed,
  createTextCommand,
  formatEvalValue,
  parseText,
  sanitizeEvalOutput
} = require("./helpers");
module.exports = createTextCommand({
    name: "eval",
    imageKey: "eval",
    description: "Evaluate JavaScript as the bot owner.",
    permission: "owner",
    options: [
      {
        name: "code",
        description: "JavaScript to evaluate",
        required: true
      }
    ],
    async execute(context) {
      const code = context.type === "prefix"
        ? context.rawArgsText
        : parseText(context, "code", 0, "Put something to Evaluate.");
      if (!code) throw new Error("Put something to Evaluate.");
      let content;
      if (String(code).toLowerCase().includes("token")) {
        content = "no token for u.";
      } else {
        try {
          const value = await Promise.resolve(eval(code));
          const output = sanitizeEvalOutput(formatEvalValue(value), context.config);
          const evaluation = buildEvalEmbed({
            code,
            output,
            title: "Evaluation",
            footer: `Evaluated for ${context.user.tag || context.user.username}`
          }).embeds[0];
          const fields = evaluation.fields.map((field) => `**${field.name}**\n${field.value}`).join("\n\n");
          content = `${evaluation.title}\n\n${fields}\n\n${evaluation.footer?.text || ""}`;
        } catch (error) {
          content = `Error\n${String(error).slice(0, 3900)}`;
        }
      }
      const exampleContainer = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent(content.slice(0, 4000)))
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
