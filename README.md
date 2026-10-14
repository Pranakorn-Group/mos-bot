# Mos Bot

Modernized Discord bot for P5 Shop with:

- Discord.js v14 with Components V2 responses
- Slash commands with prefix fallback
- SQLite-backed prefix and command-image persistence
- Cloudflare R2 image uploads, organized by command/date
- Docker and Komodo deployment support
- GitHub Actions CI and GHCR publishing

## Requirements

- Node.js 22+
- A Discord bot token
- Privileged `Message Content Intent` enabled if you want prefix commands to keep working

## Local setup

1. Copy `.env.example` to `.env`.
2. Fill in `DISCORD_TOKEN` and `OWNER_ID`.
3. Install dependencies with `npm install`.
4. Start the bot locally with `npm run dev` (or `bun dev`); this uses `./data/bot.sqlite` instead of the container-only `/data` path. `npm start` is intended for the container/production setup.

To add or replace a command image, run `/setup-image`, choose a command, and attach an image. The bot uploads PNG, JPEG, GIF, or WebP images up to 10 MB under `pranakorn/p5shop/mosbot/<command>/<date>/` in R2 and stores the public URL in SQLite. Each command module declares its `imageKey` beside its command name; the handler reads that key from SQLite and displays only URLs under `R2_PUBLIC_URL`. Configure a public R2 custom domain (or another public bucket URL) so Discord can display uploaded images.

Useful scripts:

- `npm run dev` to run in watch mode
- `npm run lint` for static checks
- `npm test` for unit tests
- `npm run sync:commands` to force command registration

## Environment variables

- `DISCORD_TOKEN`: required bot token
- `OWNER_ID`: required Discord user ID for owner-only commands
- `DEFAULT_PREFIX`: fallback prefix for message commands, default `.`
- `DATABASE_PATH`: SQLite database path, default `./data/bot.sqlite`
- `NODE_ENV`: `development` or `production`
- `SYNC_COMMANDS_ON_STARTUP`: set to `false` to skip startup command sync
- `DISCORD_GUILD_ID`: optional guild ID to register slash commands to one guild for fast updates
- `ENABLE_PREFIX_COMMANDS`: set to `false` if you only want slash commands and do not want to enable the Message Content privileged intent
- `R2_ACCOUNT_ID`: Cloudflare account ID
- `R2_ACCESS_KEY_ID`: R2 S3-compatible access key ID
- `R2_SECRET_ACCESS_KEY`: R2 S3-compatible secret access key
- `R2_BUCKET_NAME`: target R2 bucket
- `R2_PUBLIC_URL`: public base URL for the bucket; must serve objects directly

## Docker

Build locally:

```bash
docker build -t mos-bot .
```

Run locally:

```bash
docker run --env-file .env -v "$(pwd)/data:/data" mos-bot
```

## Komodo deployment

Komodo should deploy this service as a Docker Compose stack.

1. Publish the image to GHCR using the included GitHub Actions workflow.
2. In Komodo, create a stack from `compose.yaml`.
3. Set `GHCR_IMAGE` if you want to override the default package name. By default this stack pulls `ghcr.io/meaookung144/mos-bot:latest`.
4. In Komodo, define the runtime environment variables for the stack:
   - `DISCORD_TOKEN`
   - `OWNER_ID`
   - `DEFAULT_PREFIX` if you want to override `.`
   - `DATABASE_PATH` if you want to override `/data/bot.sqlite`
   - `SYNC_COMMANDS_ON_STARTUP` if you want to disable command sync
   - `DISCORD_GUILD_ID` if you want guild-scoped slash command registration
   - `ENABLE_PREFIX_COMMANDS=false` if you do not want to enable Discord's Message Content intent
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and `R2_PUBLIC_URL` for `/setup-image`
5. Keep the `/data` volume so prefix settings persist across restarts.

If you run Compose outside Komodo, you can still export those variables from your shell or load them from a local `.env` file before starting the stack.

## GitHub Actions and GHCR

- `.github/workflows/ci.yml` runs lint, tests, and a Docker build check.
- `.github/workflows/publish-ghcr.yml` publishes images to GHCR on pushes to `main` and on version tags.

Published tags include:

- `latest` on the default branch
- `sha-<commit>`
- semver tags when you push git tags like `v2.1.0`
