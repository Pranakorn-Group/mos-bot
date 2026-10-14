const {
  ContainerBuilder,
  MediaGalleryBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder
} = require("discord.js");

function buildV2Payload(item, ephemeral = false) {
  const text = typeof item === "string"
    ? item
    : [item.content, item.embeds?.map((embed) => [embed.title, embed.description].filter(Boolean).join("\n")).join("\n\n")]
        .filter(Boolean)
        .join("\n\n");
  const container = new ContainerBuilder();
  if (text) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(text.slice(0, 4000)));
  }
  container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

  const imageUrls = [...text.matchAll(/https?:\/\/[^\s<>]+/g)]
    .map(([url]) => url.replace(/[),.]+$/, ""))
    .filter((url) => /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url));
  if (imageUrls.length) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(...imageUrls.slice(0, 10).map((url) => ({ media: { url } })))
    );
  }

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2 | (ephemeral ? MessageFlags.Ephemeral : 0),
    allowedMentions: { parse: [], repliedUser: false }
  };
}

async function respondPrefix(message, payload) {
  const items = Array.isArray(payload) ? payload : [payload];

  for (const item of items) {
    await message.channel.send(
      item?.flags & MessageFlags.IsComponentsV2 ? item : buildV2Payload(item)
    );
  }
}

async function respondInteraction(interaction, payload, fallbackEphemeral = false) {
  const items = Array.isArray(payload) ? payload : [payload];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const basePayload = item?.flags & MessageFlags.IsComponentsV2
      ? item
      : buildV2Payload(item, fallbackEphemeral);

    if (index === 0) {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(basePayload);
      } else {
        await interaction.reply(basePayload);
      }
      continue;
    }

    await interaction.followUp(basePayload);
  }
}

module.exports = {
  buildV2Payload,
  respondPrefix,
  respondInteraction
};
