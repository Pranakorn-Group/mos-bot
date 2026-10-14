const fs = require("node:fs");
const path = require("node:path");

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseBoolean(value, defaultValue) {
  if (value == null || value === "") {
    return defaultValue;
  }

  return !["false", "0", "no"].includes(String(value).toLowerCase());
}

function loadConfig() {
  loadDotEnv();

  return {
    discordToken: requireEnv("DISCORD_TOKEN"),
    ownerId: requireEnv("OWNER_ID"),
    defaultPrefix: process.env.DEFAULT_PREFIX || ".",
    databasePath: process.env.DATABASE_PATH || path.resolve(process.cwd(), "data", "bot.sqlite"),
    nodeEnv: process.env.NODE_ENV || "development",
    syncCommandsOnStartup: parseBoolean(process.env.SYNC_COMMANDS_ON_STARTUP, true),
    guildId: process.env.DISCORD_GUILD_ID || null,
    enablePrefixCommands: parseBoolean(process.env.ENABLE_PREFIX_COMMANDS, true),
    r2AccountId: process.env.R2_ACCOUNT_ID || null,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || null,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || null,
    r2BucketName: process.env.R2_BUCKET_NAME || null,
    r2PublicUrl: process.env.R2_PUBLIC_URL || null
  };
}

module.exports = {
  loadConfig
};
