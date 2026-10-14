const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

class PrefixStore {
  constructor(filename, defaultPrefix) {
    this.filename = path.resolve(filename);
    this.defaultPrefix = defaultPrefix;

    fs.mkdirSync(path.dirname(this.filename), { recursive: true });

    this.db = new DatabaseSync(this.filename);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS guild_prefixes (
        guild_id TEXT PRIMARY KEY,
        prefix TEXT NOT NULL
      )
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS command_images (
        command_name TEXT PRIMARY KEY,
        object_key TEXT NOT NULL,
        public_url TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.selectStatement = this.db.prepare(
      "SELECT prefix FROM guild_prefixes WHERE guild_id = ?"
    );
    this.upsertStatement = this.db.prepare(`
      INSERT INTO guild_prefixes (guild_id, prefix)
      VALUES (?, ?)
      ON CONFLICT(guild_id) DO UPDATE SET prefix = excluded.prefix
    `);
  }

  getPrefix(guildId) {
    if (!guildId) {
      return this.defaultPrefix;
    }

    const row = this.selectStatement.get(String(guildId));
    return row?.prefix || this.defaultPrefix;
  }

  setPrefix(guildId, prefix) {
    this.upsertStatement.run(String(guildId), prefix);
    return prefix;
  }

  getCommandImage(commandName) {
    const row = this.db
      .prepare("SELECT object_key, public_url FROM command_images WHERE command_name = ?")
      .get(String(commandName));
    return row ? { objectKey: row.object_key, url: row.public_url } : null;
  }

  setCommandImage(commandName, objectKey, publicUrl) {
    this.db.prepare(`
      INSERT INTO command_images (command_name, object_key, public_url)
      VALUES (?, ?, ?)
      ON CONFLICT(command_name) DO UPDATE SET
        object_key = excluded.object_key,
        public_url = excluded.public_url,
        updated_at = CURRENT_TIMESTAMP
    `).run(String(commandName), String(objectKey), String(publicUrl));
  }
}

module.exports = {
  PrefixStore
};
