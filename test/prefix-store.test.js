const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { PrefixStore } = require("../src/storage/prefix-store");

test("PrefixStore returns default prefix and persists updates", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mos-bot-"));
  const store = new PrefixStore(path.join(tempDir, "bot.sqlite"), ".");

  assert.equal(store.getPrefix("guild-1"), ".");
  store.setPrefix("guild-1", "!");
  assert.equal(store.getPrefix("guild-1"), "!");
});

test("PrefixStore stores and replaces an image URL per command", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mos-bot-images-"));
  const store = new PrefixStore(path.join(tempDir, "bot.sqlite"), ".");

  assert.equal(store.getCommandImage("pay"), null);
  store.setCommandImage("pay", "pay/2026/receipt.webp", "https://cdn.example/pay.webp");
  assert.deepEqual(store.getCommandImage("pay"), {
    objectKey: "pay/2026/receipt.webp",
    url: "https://cdn.example/pay.webp"
  });
  store.setCommandImage("pay", "pay/2026/receipt-2.webp", "https://cdn.example/pay-2.webp");
  assert.equal(store.getCommandImage("pay").url, "https://cdn.example/pay-2.webp");
});
