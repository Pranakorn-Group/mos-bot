const { MessageFlags } = require("discord.js");
const { hasPermission, permissionMessage } = require("./helpers");
const { respondInteraction, respondPrefix } = require("../utils/respond");

async function executeCommand(command, context) {
  context.commandImage = context.store.getCommandImage(command.imageKey);
  if (!hasPermission(context, command)) {
    const message = permissionMessage(command);
    if (context.type === "slash") {
      await respondInteraction(context.interaction, message, true);
    } else {
      await respondPrefix(context.message, message);
    }
    return;
  }

  try {
    if (context.type === "slash" && command.name === "setup-image" && !context.interaction.deferred && !context.interaction.replied) {
      await context.interaction.deferReply({ flags: MessageFlags.Ephemeral });
      context.ephemeralReply = true;
    }
    await command.execute(context);
  } catch (error) {
    const message = error.message || "Something went wrong while running this command.";
    if (context.type === "slash") {
      await respondInteraction(context.interaction, message, true);
    } else {
      await respondPrefix(context.message, message);
    }
  }
}

module.exports = {
  executeCommand
};
