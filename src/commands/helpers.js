const {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require("discord.js");
const { inspect } = require("node:util");

const permissionErrors = {
  admin: "You Don't have permissions.",
  owner: "You are not owner!"
};

function sanitizeEvalOutput(text, config) {
  let output = String(text);
  const secrets = [config.discordToken, process.env.DISCORD_TOKEN].filter(Boolean);

  for (const secret of secrets) {
    output = output.replaceAll(secret, "[REDACTED_TOKEN]");
  }

  return output;
}

function formatCodeBlock(label, value) {
  const text = String(value).slice(0, 1900);
  return `\`\`\`${label}\n${text}\n\`\`\``;
}

function addOption(builder, option) {
  if (option.type === "attachment") {
    return builder.addAttachmentOption((input) =>
      input
        .setName(option.name)
        .setDescription(option.description)
        .setRequired(Boolean(option.required))
    );
  }

  if (option.choices) {
    return builder.addStringOption((input) =>
      input
        .setName(option.name)
        .setDescription(option.description)
        .setRequired(Boolean(option.required))
        .addChoices(...option.choices)
    );
  }

  if (option.type === "number") {
    return builder.addNumberOption((input) =>
      input
        .setName(option.name)
        .setDescription(option.description)
        .setRequired(Boolean(option.required))
    );
  }

  return builder.addStringOption((input) =>
    input
      .setName(option.name)
      .setDescription(option.description)
      .setRequired(Boolean(option.required))
  );
}

function buildSlashData(command) {
  const builder = new SlashCommandBuilder()
    .setName(command.name)
    .setDescription(command.description);

  for (const option of command.options || []) {
    addOption(builder, option);
  }

  return builder;
}

function ensureValue(value, message) {
  if (value == null || value === "") {
    throw new Error(message);
  }
  return value;
}

function parseText(context, optionName, fallbackIndex, missingMessage) {
  return ensureValue(readOption(context, optionName, fallbackIndex), missingMessage);
}

function parseAmount(context, optionName, fallbackIndex, missingMessage) {
  const amount = Number(ensureValue(readOption(context, optionName, fallbackIndex), missingMessage));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Please provide a valid amount.");
  }
  return amount;
}

function createTextCommand(definition) {
  return {
    ...definition,
    aliases: definition.aliases || [],
    options: definition.options || [],
    slashData: buildSlashData(definition)
  };
}

function isOwner(context) {
  return context.user?.id === context.config.ownerId;
}

function isAdmin(context) {
  if (!context.memberPermissions) {
    return false;
  }

  return context.memberPermissions.has(PermissionFlagsBits.Administrator);
}

function permissionMessage(command) {
  return permissionErrors[command.permission] || "You don't have permission to use this command.";
}

function hasPermission(context, command) {
  if (command.permission === "owner") {
    return isOwner(context);
  }

  if (command.permission === "admin") {
    return isAdmin(context);
  }

  return true;
}

function buildEvalEmbed({ code, output, title, footer }) {
  return {
    embeds: [
      new EmbedBuilder()
        .setTitle(title)
        .addFields(
          { name: "Input", value: formatCodeBlock("js", code).slice(0, 1024) },
          { name: "Output", value: formatCodeBlock("txt", output).slice(0, 1024) }
        )
        .setFooter({ text: footer })
    ]
  };
}

function formatEvalValue(value) {
  return inspect(value, { depth: 2 }).slice(0, 1900) || "undefined";
}

function readOption(context, optionName, fallbackIndex = 0) {
  if (context.type === "slash") {
    return context.options.get(optionName)?.attachment ?? context.options.get(optionName)?.value ?? null;
  }

  return context.args[fallbackIndex] ?? null;
}

module.exports = {
  buildEvalEmbed,
  createTextCommand,
  ensureValue,

  formatEvalValue,
  hasPermission,
  parseAmount,
  parseText,
  permissionMessage,
  readOption,
  sanitizeEvalOutput
};
