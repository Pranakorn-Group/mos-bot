const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { mock } = require("node:test");
const { MessageFlags } = require("discord.js");
const { buildV2Payload, respondPrefix } = require("../src/utils/respond");
const { createRegistry } = require("../src/commands/registry");
const { executeCommand } = require("../src/commands/execute");
const { createR2ImageStore } = require("../src/storage/r2-images");

test("every registered command has slash data and image setup accepts an attachment", () => {
    const registry = createRegistry();
    const setup = registry.resolve("setup-image");

    assert.ok(setup);
    assert.ok(registry.all.every(command => command.slashData.toJSON()));
    assert.ok(
        registry.all.every(command => command.imageKey),
        "each command declares its image key",
    );
    assert.equal(new Set(registry.all.map(command => command.imageKey)).size, registry.all.length);
    const attachmentOption = setup.slashData.options.find(option => option.name === "image");
    assert.equal(attachmentOption.type, 11);
});

test("each command module defines and sends its own Components V2 container", () => {
    const registry = createRegistry();
    for (const command of registry.all) {
        const file = path.join(__dirname, "../src/commands", `${command.name}.js`);
        const source = fs.readFileSync(file, "utf8");
        assert.doesNotMatch(source, /function sendComponentsV2/, `${command.name} has no V2 wrapper function`);
        assert.match(
            source,
            /const [A-Za-z_$][\w$]* = new ContainerBuilder\(\)/,
            `${command.name} builds the container inline`,
        );
        assert.match(source, /new ContainerBuilder\(\)/, `${command.name} builds its container locally`);
        assert.match(source, /MessageFlags\.IsComponentsV2/, `${command.name} sets the V2 flag locally`);
        assert.match(source, /addSeparatorComponents/, `${command.name} includes a separator`);
        if (command.name !== "setup-image") {
            assert.match(
                source,
                /context\.message\.channel\.send\(payload\)/,
                `${command.name} sends prefix replies locally`,
            );
        }
    }

    const helpers = fs.readFileSync(path.join(__dirname, "../src/commands/helpers.js"), "utf8");
    assert.doesNotMatch(helpers, /ContainerBuilder|MessageFlags\.IsComponentsV2/);
});

test("slash response uses Components V2 container with a separator", () => {
    const payload = buildV2Payload("Hello");

    assert.ok(payload.flags & MessageFlags.IsComponentsV2);
    assert.equal(payload.components[0].toJSON().type, 17);
    assert.ok(payload.components[0].toJSON().components.some(component => component.type === 14));
});

test("prefix command returns are also sent inside a V2 container", async () => {
    let sent;
    await respondPrefix(
        {
            channel: {
                send: async payload => {
                    sent = payload;
                },
            },
        },
        "prefix reply",
    );

    assert.ok(sent.flags & MessageFlags.IsComponentsV2);
    assert.equal(sent.components[0].toJSON().type, 17);
});

test("images from outside the configured R2 base are not displayed", async () => {
    const registry = createRegistry();
    let sent;
    const context = {
        type: "slash",
        config: { r2PublicUrl: "https://images.example" },
        member: {},
        memberPermissions: { has: () => true },
        store: { getCommandImage: () => ({ url: "https://cdn.discordapp.com/attachments/1/old.png" }) },
        interaction: {
            replied: false,
            deferred: false,
            reply: async payload => {
                sent = payload;
            },
        },
    };
    await executeCommand(registry.resolve("shop-open"), context);

    assert.equal(
        sent.components[0].toJSON().components.some(component => component.type === 12),
        false,
    );
});

test("split parameterized commands execute through shared option helpers", async () => {
    const registry = createRegistry();
    const options = new Map([
        ["amount", { value: 50 }],
        ["head", { value: "Family" }],
        ["email", { value: "buyer@example.com" }],
        ["duration", { value: "1 day" }],
        ["code", { value: "1 + 1" }],
    ]);
    const context = {
        type: "slash",
        options: { get: name => options.get(name) },
        config: { ownerId: "owner", discordToken: "safe" },
        user: { id: "owner", tag: "owner#0001", username: "owner" },
        member: {},
        memberPermissions: { has: () => true },
        commandImage: null,
        interaction: {
            replied: false,
            deferred: false,
            async reply() {
                this.replied = true;
            },
            async followUp() {},
        },
        store: { getCommandImage: () => null },
    };

    for (const name of ["pay", "spay", "qrpay", "longyt", "wait", "eval"]) {
        await executeCommand(registry.resolve(name), context);
        assert.equal(context.interaction.replied, true, `${name} should send a reply`);
        context.interaction.replied = false;
    }
});

test("a saved command image replaces its legacy standalone image URL", async () => {
    const registry = createRegistry();
    let reply;
    let imageLookupKey;
    const command = { ...registry.resolve("shop-close"), imageKey: "shop-banner" };
    const context = {
        type: "slash",
        member: {},
        memberPermissions: { has: () => true },
        config: { r2PublicUrl: "https://images.example" },
        store: {
            getCommandImage: key => {
                imageLookupKey = key;
                return { url: "https://images.example/shop-open.webp" };
            },
        },
        interaction: {
            reply: async payload => {
                reply = payload;
            },
        },
    };

    await executeCommand(command, context);

    assert.equal(imageLookupKey, "shop-banner");
    const media = reply.components[0].toJSON().components.find(component => component.type === 12);
    assert.equal(media.items[0].media.url, "https://images.example/shop-open.webp");
});

test("R2 uploader rejects non-Discord attachment URLs", async () => {
    const imageStore = createR2ImageStore({
        r2AccountId: "account",
        r2AccessKeyId: "access",
        r2SecretAccessKey: "secret",
        r2BucketName: "bucket",
        r2PublicUrl: "https://images.example",
    });

    await assert.rejects(
        imageStore.upload({
            commandName: "nf",
            attachment: { url: "https://127.0.0.1/private", contentType: "image/png" },
        }),
        /Only image attachments hosted by Discord/,
    );
});

test("R2 uploader writes images under the project/command/date folder", async () => {
    const config = {
        r2AccountId: "account",
        r2AccessKeyId: "access",
        r2SecretAccessKey: "secret",
        r2BucketName: "bucket",
        r2PublicUrl: "https://images.example",
    };
    let uploaded;
    const fetchMock = mock.method(
        globalThis,
        "fetch",
        async () => new Response(Buffer.from("image bytes"), { headers: { "content-type": "image/png" } }),
    );

    try {
        const imageStore = createR2ImageStore(config, {
            async send(command) {
                uploaded = command.input;
            },
        });
        const result = await imageStore.upload({
            commandName: "nf",
            attachment: {
                url: "https://cdn.discordapp.com/attachments/1/image.png",
                contentType: "image/png",
            },
        });

        assert.match(uploaded.Key, /^pranakorn\/p5shop\/mosbot\/nf\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]+\.png$/);
        assert.equal(uploaded.Bucket, "bucket");
        assert.equal(uploaded.ContentType, "image/png");
        assert.equal(result.url, `https://images.example/${uploaded.Key}`);
    } finally {
        fetchMock.mock.restore();
    }
});

test("image setup defers before its upload work", async () => {
    const order = [];
    const interaction = {
        deferred: false,
        replied: false,
        async deferReply() {
            this.deferred = true;
            order.push("defer");
        },
        async followUp() {
            order.push("reply");
        },
    };
    const command = {
        name: "setup-image",
        permission: "admin",
        async execute(context) {
            assert.equal(interaction.deferred, true);
            order.push("upload");
            await interaction.followUp(buildV2Payload("uploaded"));
        },
    };

    await executeCommand(command, {
        type: "slash",
        interaction,
        member: {},
        memberPermissions: { has: () => true },
        store: { getCommandImage: () => null },
    });

    assert.deepEqual(order, ["defer", "upload", "reply"]);
});

test("every registered command sends only Components V2 replies", async () => {
    const registry = createRegistry();
    const optionValues = new Map([
        ["amount", 50],
        ["head", "Family"],
        ["email", "buyer@example.com"],
        ["duration", "1 day"],
        ["code", "1 + 1"],
        ["value", null],
        ["command", "nf"],
    ]);

    for (const command of registry.all) {
        const replies = [];
        const imageLookups = [];
        const interaction = {
            deferred: false,
            replied: false,
            client: { on() {} },
            async deferReply() {
                this.deferred = true;
            },
            async reply(payload) {
                this.replied = true;
                replies.push(payload);
            },
            async followUp(payload) {
                replies.push(payload);
            },
            options: {
                get: name => ({ value: optionValues.get(name) ?? null }),
                getString: name => optionValues.get(name) ?? null,
                getAttachment: () => ({ url: "https://cdn.discordapp.com/attachments/1/image.png" }),
            },
        };
        const context = {
            type: "slash",
            config: { ownerId: "owner", discordToken: "safe", r2PublicUrl: "https://images.example" },
            user: { id: "owner", tag: "owner#0001", username: "owner" },
            guildId: "guild",
            member: {},
            memberPermissions: { has: () => true },
            options: interaction.options,
            interaction,
            r2ImageStore: {
                upload: async ({ commandName }) => ({
                    objectKey: `${commandName}/test/image.webp`,
                    url: `https://images.example/${commandName}/test/image.webp`,
                }),
            },
            store: {
                getCommandImage: key => {
                    imageLookups.push(key);
                    return { url: `https://images.example/${key}.webp` };
                },
                setCommandImage: () => {},
                getPrefix: () => ".",
                setPrefix: () => {},
            },
        };

        await executeCommand(command, context);
        assert.deepEqual(imageLookups, [command.imageKey]);
        assert.ok(replies.length, `/${command.name} should send a reply`);
        const mediaComponents = replies
            .flatMap(reply => reply.components[0].toJSON().components)
            .filter(component => component.type === 12);
        if (command.name !== "qrpay") {
            assert.ok(mediaComponents.length, `/${command.name} should display its saved R2 image`);
            assert.ok(
                mediaComponents.every(component =>
                    component.items.every(item => item.media.url.startsWith("https://images.example/")),
                ),
                `/${command.name} should display only URLs under the configured R2 base`,
            );
        }
        for (const reply of replies) {
            assert.ok(reply.flags & MessageFlags.IsComponentsV2, `/${command.name} should use Components V2`);
            assert.ok(reply.components.some(component => component.toJSON().type === 17));
            assert.equal(reply.content, undefined);
            assert.equal(reply.embeds, undefined);
            assert.deepEqual(reply.allowedMentions, { parse: [], repliedUser: false });
            assert.doesNotMatch(JSON.stringify(reply), /discordapp\.com|discordapp\.net/i);
        }
    }
});
