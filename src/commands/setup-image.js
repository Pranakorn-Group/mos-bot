const { ContainerBuilder, MessageFlags } = require("discord.js");
const { createTextCommand } = require("./helpers");
const { createR2ImageStore } = require("../storage/r2-images");

const commandChoices = [
  "eval", "hi", "hmpr", "inyt", "keygen", "longyt", "nf", "otp", "outyt",
  "pay", "qrpay", "shop-close", "shop-open", "spay", "spot", "ticket", "tryweb",
  "ty", "wait", "webplan", "prefix", "setup-image"
].map((name) => ({ name, value: name }));

module.exports = createTextCommand({
  name: "setup-image",
  imageKey: "setup-image",
  description: "Upload or replace an image for a bot command.",
  permission: "admin",
  options: [
    {
      name: "command",
      description: "Choose which command should display this image",
      required: true,
      choices: commandChoices
    },
    {
      name: "image",
      description: "Image to upload to Cloudflare R2 (maximum 10 MB)",
      required: true,
      type: "attachment"
    }
  ],
  async execute(context) {
    if (context.type !== "slash") {
      throw new Error("Use the /setup-image slash command to upload an image.");
    }
    const commandName = context.options.getString("command", true);
    const attachment = context.options.getAttachment("image", true);
    const r2 = context.r2ImageStore || createR2ImageStore(context.config);
    const image = await r2.upload({ commandName, attachment });
    context.store.setCommandImage(commandName, image.objectKey, image.url);
    context.commandImage = image;
    const exampleContainer = new ContainerBuilder()
      .setAccentColor(0x0099ff)
      .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`Image saved for /${commandName}: ${image.url}`))
      .addSeparatorComponents((separator) => separator.setDivider(true));
    const imageUrl = context.commandImage?.url;
    const r2Base = context.config?.r2PublicUrl?.replace(/\/+$/, "");
    if (imageUrl && r2Base?.startsWith("https://") && imageUrl.startsWith(`${r2Base}/`)) {
      exampleContainer.addMediaGalleryComponents((gallery) => gallery.addItems({ media: { url: imageUrl } }));
    }
    const payload = { components: [exampleContainer], flags: MessageFlags.IsComponentsV2 | (context.ephemeralReply ? MessageFlags.Ephemeral : 0), allowedMentions: { parse: [], repliedUser: false } };
    if (context.interaction.deferred || context.interaction.replied) await context.interaction.followUp(payload);
    else await context.interaction.reply(payload);
  }
});
