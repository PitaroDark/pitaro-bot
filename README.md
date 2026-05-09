# PItaro Bot

A self-hosted Discord music bot built with TypeScript. Plays audio from YouTube and SoundCloud into voice channels with a full queue system and playback controls.

## Features

- YouTube and SoundCloud streaming via `discord-player` + `discord-player-youtubei` v3
- Automatic PO token generation — no cookies, no manual maintenance
- Full queue management: add, skip, remove, shuffle, clear
- Playback controls: pause, resume, seek, volume, loop modes
- Auto-disconnect: leaves after 60 s of queue inactivity, 5 s when the channel is empty, or immediately if force-kicked
- Slash command interface under `/music`
- Structured logging with configurable levels
- Docker deployment with multi-arch support (x64 and ARM64)

## Prerequisites

- Node.js >= 18
- pnpm >= 9
- A [Discord Application](https://discord.com/developers/applications) with a bot token and the following privileged intents enabled:
  - `GUILDS`
  - `GUILD_MESSAGES`
  - `GUILD_VOICE_STATES`

## Installation

```bash
git clone <repo-url>
cd pitaro-bot
pnpm install
```

## Configuration

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `BOT_TOKEN` | Yes | Discord bot token |
| `DEV_GUILD_ID` | No | Guild ID for instant command registration in development. Omit in production for global commands. |
| `LOG_LEVEL` | No | `error`, `warn`, `info`, or `debug`. Defaults to `debug` in dev, `info` in prod. |

## Running

**Development** (hot reload):
```bash
pnpm dev
```

**Production with Docker:**
```bash
docker compose up -d
```

**Production manual build:**
```bash
pnpm build
node build/main.js
```

## Commands

All commands are grouped under `/music`.

| Command | Description |
|---|---|
| `/music play <query>` | Search and play a song by name or URL. Replies "Reproduciendo" if the queue was empty, "Añadido a la cola" if a track was already playing. Notifies the channel when the next queued track starts. |
| `/music skip [count]` | Skip one or more tracks |
| `/music pause` | Pause playback |
| `/music resume` | Resume paused playback |
| `/music stop` | Stop playback and disconnect from voice |
| `/music seek <time>` | Jump to a position — `1:30` or `90` (seconds) |
| `/music restart` | Restart the current track from the beginning |
| `/music nowplaying` | Show the current track with elapsed time |
| `/music queue [page]` | Show the queue |
| `/music clear` | Clear the queue |
| `/music shuffle` | Shuffle the queue |
| `/music remove <position>` | Remove a track from the queue by position |
| `/music volume <0-100>` | Adjust playback volume |
| `/music loop <mode>` | Set loop mode: `off`, `track`, or `queue` |
| `/music provider <source>` | Switch search provider: `YouTube` or `Spotify` |
| `/music login <provider>` | Sign in with an external provider (Spotify OAuth — coming soon) |
| `/music help` | Show all available commands |

## Project Structure

```
src/
├── main.ts                                    # Entry point — bot, player, DI bootstrap
├── shared/
│   ├── Container.ts                           # tsyringe DI container
│   ├── Constants.ts                           # Shared constants
│   ├── Logger.ts                              # Winston logger wrapper
│   ├── RequestContext.ts                      # AsyncLocalStorage guild/user context
│   └── errors/
│       ├── AppError.ts
│       ├── NotFoundError.ts
│       ├── PermissionError.ts
│       └── ValidationError.ts
└── discord/
    ├── domain/
    │   ├── errors/MusicErrors.ts              # Domain error types
    │   ├── ports/in/MusicUseCase.ts           # Music use case interface
    │   └── types/Music.ts                     # Domain types
    ├── application/
    │   └── services/MusicService.ts           # MusicUseCase implementation
    └── infrastructure/in/
        ├── InteractionHandler.ts              # Error handling wrapper for slash commands
        ├── commands/MusicCommands.ts          # Slash command handlers
        ├── dto/DiscordResponse.ts             # Response helpers
        └── events/
            ├── CommonEvents.ts                # Discord event handlers (voice, guild, errors)
            └── PlayerEvents.ts               # discord-player event listeners
```

## Deployment Notes

The Docker image targets `linux/amd64` and `linux/arm64` (tested on OrangePi 5 Plus with RK3588).

- Uses system `ffmpeg` instead of `ffmpeg-static` for better ARM64 reliability
- Installs `yt-dlp` via pip to ensure the latest version
- `@discordjs/opus` is compiled from source in the build stage

## Known Limitations

- Some VEVO and official artist videos on YouTube have embed restrictions. When this happens the player automatically falls back to SoundCloud. If no SoundCloud match exists the track is skipped with an error message.
- Spotify URLs resolve to YouTube/SoundCloud streams — direct Spotify streaming is not supported.
- YouTube Radio/Mix URLs (`list=RDL...`) are automatically stripped to their video ID — the mix itself is not queued, only the individual track.

## Contributing

1. Fork the repository and clone it locally
2. Create a branch from `main` with a descriptive name:
   ```bash
   git checkout -b feat/my-feature
   # or
   git checkout -b fix/my-bug-fix
   ```
3. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "feat: short description of the change"
   ```
4. Push the branch and open a Pull Request against `main`:
   ```bash
   git push origin feat/my-feature
   ```
5. Describe what the PR does and why in the PR body. Link any related issues.

### Branch naming

| Prefix | Use for |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `chore/` | Maintenance, dependencies, tooling |
| `docs/` | Documentation only |

## License

MIT — see [LICENSE](LICENSE).
