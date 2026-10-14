const { Collection } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

const internalFiles = new Set(["registry.js", "helpers.js", "execute.js"]);
const commands = fs
  .readdirSync(__dirname)
  .filter((file) => file.endsWith(".js") && !internalFiles.has(file))
  .sort()
  .map((file) => require(path.join(__dirname, file)));

function createRegistry() {
  const commandsByName = new Collection();
  const aliases = new Collection();

  for (const command of commands) {
    commandsByName.set(command.name, command);
    for (const alias of command.aliases) {
      aliases.set(alias, command.name);
    }
  }

  function resolve(name) {
    return commandsByName.get(name) || commandsByName.get(aliases.get(name));
  }

  return {
    all: commands,
    commandsByName,
    resolve
  };
}

module.exports = {
  createRegistry
};
