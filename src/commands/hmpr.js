const { ContainerBuilder, MessageFlags } = require("discord.js");
const { createTextCommand } = require("./helpers");

module.exports = createTextCommand({
    name: "hmpr",
    imageKey: "hmpr",
    description: "Send HMPR website setup instructions.",
    permission: "admin",
    async execute(context) {
      const content = [
        "<:mouseclickcursor:916913555914252309>  ขั้นตอนการติดตั้งและ ตั้งค่าเว็บไซต์ HMPR เมื่อแอดมินแจ้งว่าติดตั้งเสร็จเรียบร้อยแล้ว\n\n1  ให้ท่านทำการสมัคร สมาชิก ของเว็บไซต์ของท่าน จากนั้น ทำการแจ้ง Username ของท่าน เพื่อ ให้ แอดมินให้ยศ เพื่อเข้าสู่หลังบ้าน  โดยที่หลักการการตั้ง Username คือ Username ยาวมากกว่า 3 ตัวแต่น้อยกว่า 16 ตัว",
        "2  เมื่อแอดมินให้ยศเรียบร้อยแล้วให้กดที่ Icon รูปตัวคน   >  แล้วเลือก  หลังบ้าน",
        "3 จากนั้น ทำการเลือกเมนูตรงแถบเมนูด้านข้่าง หรือ Side Bar > ตั้งค่าทั่วไป > ตั้งค่าข้อมูลเว็บไซต์",
        "4 หากท่าน Config ไม่เป็น ท่านสามารถเลือกรับชมวิดีโอสาธิตการ ตั้งค่าเว็บไซตฺ์ ได้ที่ กรอบ วิธีการใช้งาน\n\nเพิ่มเติม ในส่วนของ การตั้งค่าเว็บไซต์ ท่านสามารถใช้ Html tag ต่างๆได้ เช่น <br> <a> <hr> <li> <ul> เป็นต้น ในเฉพาะส่วนของ รายละเอียดส่วนท้ายของเว็บ ประกาศของเว็บ เท่านั้น",
        "?  หากท่านมีคำถามที่สงสัยเพิ่มเติม หรือ ต้องการสอบถามข้อมูลเพิ่มเติมในด้านต่าง สามารถสอบถาม แอดมินได้ ใน Ticket นี้ครับ",
        "<#997125382916554862> สำหรับห้องนี้จะใช้สำหรับการประกาศต่างๆของเว็บนะครับ สามาถดูประกาศ อัพเดตหรือว่าแจ้งเว็บมีปัญหาได้เลยนะครับ\n\n<#1040633002864152606> ห้องนี้จะแจ้งข้อกำหนดการให้บริการเว็บไซต์ระบบเช่า และ กฏการใช้งาน กรุณาอ่านด้วยนะครับ\n\n<#997125680854736917>  ห้องนี้ใช้ในการพูดคุยติดต่อสื่อสารกับผู้ใช้งานเว็บไซต์คนอื่นแจ้งบัคหรือปัญหาแบบส่วนรวมและสามารถขอระบบหรือเสนอระบบต่างๆได้เลยนะครับ\n\n<:hmprwhite:1029035095958495262> สำหรับ Ticket เว็บนี้จะอยู่กับท่านไปตลอดการใช้งานเว็บไซต์นะครับ\n\n<:incorrectnonotnotcheck:916913350041026610> ไม่ต้องกดปิด ticket ครับผม"
      ];
      const exampleContainer = new ContainerBuilder().setAccentColor(0x0099ff);
      for (const item of content) {
        exampleContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(item));
      }
      exampleContainer.addSeparatorComponents((separator) => separator.setDivider(true));
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
