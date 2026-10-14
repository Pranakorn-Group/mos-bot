const { ContainerBuilder, MessageFlags } = require("discord.js");
const { createTextCommand, parseAmount } = require("./helpers");

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
        type: "number"
      }
    ],
    async execute(context) {
      const amount = parseAmount(context, "amount", 0, "ใส่ค่าด้วย");
      const fee = (amount * 1.02).toFixed(2);
      const content = `หากท่านโอนเงินผ่าน ทรูมั่นนี่วอลเล็ทกรุณาโอนเงินมากกว่าหรือเท่ากับ ${fee} บาท\n\n(แต่หากท่านโอนผ่านช่องทางอื่นเช่น ธนาคาร สแกน QR Prompt pay ผ่านทรูมั่นนี่วอลเล็ท / ธนาคาร ท่านสามารถชำระเงินจำนวน ${amount} บาทได้เลยไม่ต้องชำระค่าธรรมเนียม)\n\n<:incorrectnonotnotcheck:916913350041026610> ไม่รับซองของขวัญ Aungpao\n<a:bc7:855859841951465492>  ไม่มีนโยบายการคืนเงินกรุณาตรวจสอบก่อนการชำระเงิน`;
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
