const {
  ActivityType,
  Client,
  Events,
  GatewayIntentBits
} = require("discord.js");
const { loadConfig } = require("./config");
const { PrefixStore } = require("./storage/prefix-store");
const { createRegistry } = require("./commands/registry");
const { executeCommand } = require("./commands/execute");
const { syncCommands } = require("./sync-commands");

function createPrefixContext({ message, args, config, store, client }) {
  return {
    type: "prefix",
    client,
    config,
    store,
    guildId: message.guild?.id || null,
    message,
    args,
    rawArgsText: args.join(" "),
    member: message.member,
    memberPermissions: message.member?.permissions,
    user: message.author
  };
}

function createSlashContext({ interaction, config, store, client }) {
  return {
    type: "slash",
    client,
    config,
    store,
    guildId: interaction.guildId,
    interaction,
    options: interaction.options,
    member: interaction.member,
    memberPermissions: interaction.memberPermissions,
    user: interaction.user
  };
}

function createBot() {
  const config = loadConfig();
  const store = new PrefixStore(config.databasePath, config.defaultPrefix);
  const registry = createRegistry();
  const intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ];

  if (config.enablePrefixCommands) {
    intents.push(GatewayIntentBits.MessageContent);
  }

  const client = new Client({
    intents
  });

  client.on(Events.ClientReady, async (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
    readyClient.user.setStatus("idle");
    readyClient.user.setActivity("P5 Shop", { type: ActivityType.Watching });

    if (config.syncCommandsOnStartup) {
      const result = await syncCommands({ client: readyClient, config, registry });
      console.log(
        `Synchronized ${result.count} slash commands (${result.scope}).`
      );
    }
  });

  client.on(Events.Error, (error) => {
    console.error("Discord client error:", error);
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) {
      return;
    }

    const prefix = store.getPrefix(message.guild.id);
    if (!message.content.startsWith(prefix)) {
      return;
    }

    const content = message.content.slice(prefix.length).trim();
    if (!content) {
      return;
    }

    const args = content.split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) {
      return;
    }

    const command = registry.resolve(commandName);
    if (!command) {
      return;
    }

    const context = createPrefixContext({
      message,
      args,
      config,
      store,
      client
    });
    await executeCommand(command, context);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = registry.resolve(interaction.commandName);
    if (!command) {
      return;
    }

    const context = createSlashContext({
      interaction,
      config,
      store,
      client
    });
    await executeCommand(command, context);
  });

  return {
    client,
    config,
    store,
    registry,
    start() {
      return client.login(config.discordToken);
    },
    syncCommands() {
      return syncCommands({ client, config, registry });
    }
  };
}

module.exports = {
  createBot
};
