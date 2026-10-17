
const {
  ContainerBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const {
  createTextCommand,
  parseAmount,
} = require("./helpers");

const HANDLER_KEY = Symbol.for("mos-bot.pay-button");

function registerButtonHandler(client) {
  if (client[HANDLER_KEY]) return;

  client[HANDLER_KEY] = true;

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const [action, amountText] = interaction.customId.split(":");

    if (action !== "pay-button") return;

    const amount = Number(amountText);

    if (!Number.isFinite(amount) || amount <= 0) {
      await interaction.reply({
        content: "ยอดเงินไม่ถูกต้อง กรุณาสร้างรายการชำระเงินใหม่",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const container = new ContainerBuilder()
      .setAccentColor(0x0099ff)
      .addTextDisplayComponents((text) =>
        text.setContent(
          [
            "## รายละเอียดการชำระเงิน",
            "",
            `ยอดชำระ: **${amount.toFixed(2)} บาท**`,
            "",
            "ช่องทางอื่นสามารถชำระตามยอดปกติได้",
          ].join("\n")
        )
      )
      .addSeparatorComponents((separator) =>
        separator.setDivider(true)
      )
      .addMediaGalleryComponents((gallery) =>
        gallery.addItems({
          media: {
            url: `https://promptpay.io/1102200281061/${amount}`,
          },
        })
      );

    await interaction.reply({
      components: [container],
      flags:
        MessageFlags.IsComponentsV2 |
        MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  });
}

module.exports = createTextCommand({
  name: "pay",
  imageKey: "pay",
  description: "Send payment instructions.",
  permission: "admin",

  options: [
    {
      name: "amount",
      description: "Payment amount",
      required: true,
      type: "number",
    },
  ],

  async execute(context) {
    const amount = parseAmount(
      context,
      "amount",
      0,
      "ใส่ค่าด้วย"
    );

    // ใช้ client ที่มากับ Interaction หรือ Message
    const client =
      context.interaction?.client ??
      context.message?.client;

    if (!client) {
      throw new Error(
        "Cannot access Discord client from command context."
      );
    }

    // ลงทะเบียน Button Handler โดยไม่ต้องแก้ bot.js
    registerButtonHandler(client);

    const fee = (amount * 1.02).toFixed(2);

    const content =
      `หากท่านโอนเงินผ่าน ทรูมันนี่วอลเล็ทกรุณาโอนเงินมากกว่าหรือเท่ากับ ${fee} บาท\n\n` +
      `(แต่หากท่านโอนผ่านช่องทางอื่นเช่น ธนาคาร สแกน QR PromptPay ผ่านทรูมันนี่วอลเล็ท / ธนาคาร ท่านสามารถชำระเงินจำนวน ${amount} บาทได้เลยไม่ต้องชำระค่าธรรมเนียม)\n\n` +
      `<:incorrectnonotnotcheck:916913350041026610> ไม่รับซองของขวัญ Aungpao\n` +
      `<a:bc7:855859841951465492> ไม่มีนโยบายการคืนเงิน กรุณาตรวจสอบก่อนการชำระเงิน`;

    const container = new ContainerBuilder()
      .setAccentColor(0x0099ff)
      .addTextDisplayComponents((text) =>
        text.setContent(content)
      )
      .addSeparatorComponents((separator) =>
        separator.setDivider(true)
      );

    // รูปภาพจาก R2
    const imageUrl = context.commandImage?.url;
    const r2Base = context.config?.r2PublicUrl
      ?.replace(/\/+$/, "");

    if (
      imageUrl &&
      r2Base?.startsWith("https://") &&
      imageUrl.startsWith(`${r2Base}/`)
    ) {
      container.addMediaGalleryComponents((gallery) =>
        gallery.addItems({
          media: { url: imageUrl },
        })
      );
    }

    // ฝังยอดเงินไว้ใน customId ของปุ่ม
    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`pay-button:${amount}`)
        .setLabel("ชำระเงินด้วย Qrcode")
        .setStyle(ButtonStyle.Primary)
    );

    container.addActionRowComponents(buttonRow);

    const payload = {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: {
        parse: [],
        repliedUser: false,
      },
    };

    if (context.type === "slash") {
      if (
        context.interaction.deferred ||
        context.interaction.replied
      ) {
        await context.interaction.followUp(payload);
      } else {
        await context.interaction.reply(payload);
      }
    } else {
      await context.message.channel.send(payload);
    }
  },
});
