const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const crypto = require("node:crypto");

const r2KeyPrefix = "pranakorn/p5shop/mosbot";
const allowedAttachmentHosts = new Set(["cdn.discordapp.com", "media.discordapp.net"]);
const extensionByType = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/gif", ".gif"],
  ["image/webp", ".webp"]
]);
const clients = new WeakMap();

function createR2ImageStore(config, clientOverride = null) {
  const required = [
    ["R2_ACCOUNT_ID", config.r2AccountId],
    ["R2_ACCESS_KEY_ID", config.r2AccessKeyId],
    ["R2_SECRET_ACCESS_KEY", config.r2SecretAccessKey],
    ["R2_BUCKET_NAME", config.r2BucketName],
    ["R2_PUBLIC_URL", config.r2PublicUrl]
  ];
  const missing = required.filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) {
    throw new Error(`Missing R2 configuration: ${missing.join(", ")}`);
  }

  let client = clientOverride || clients.get(config);
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.r2AccessKeyId,
        secretAccessKey: config.r2SecretAccessKey
      }
    });
    clients.set(config, client);
  }

  return {
    async upload({ commandName, attachment }) {
      const attachmentUrl = new URL(attachment.url);
      if (attachmentUrl.protocol !== "https:" || !allowedAttachmentHosts.has(attachmentUrl.hostname)) {
        throw new Error("Only image attachments hosted by Discord can be uploaded.");
      }
      const response = await fetch(attachmentUrl, { redirect: "error" });
      if (!response.ok) {
        throw new Error(`Could not download Discord attachment (${response.status}).`);
      }
      const contentType = (response.headers.get("content-type") || attachment.contentType || "")
        .split(";")[0]
        .toLowerCase();
      const extension = extensionByType.get(contentType);
      if (!extension) {
        throw new Error("The attachment must be an image.");
      }

      const chunks = [];
      let size = 0;
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Could not read the Discord attachment.");
      }
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 10 * 1024 * 1024) {
          await reader.cancel();
          throw new Error("Image must be no larger than 10 MB.");
        }
        chunks.push(Buffer.from(value));
      }
      if (!size) {
        throw new Error("Image must not be empty.");
      }
      const bytes = Buffer.concat(chunks);
      const safeCommand = commandName.replace(/[^a-z0-9-]/gi, "-");
      const objectKey = `${r2KeyPrefix}/${safeCommand}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${extension}`;
      await client.send(new PutObjectCommand({
        Bucket: config.r2BucketName,
        Key: objectKey,
        Body: bytes,
        ContentType: contentType
      }));

      return {
        objectKey,
        url: `${config.r2PublicUrl.replace(/\/$/, "")}/${objectKey}`
      };
    }
  };
}

module.exports = { createR2ImageStore };
