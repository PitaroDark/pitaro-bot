import "reflect-metadata";
import { dirname, importx } from "@discordx/importer";
import { IntentsBitField, MessageFlags } from "discord.js";
import { DefaultExtractors } from "@discord-player/extractor";
import { YoutubeExtractor } from "discord-player-youtubei";
import { Player } from "discord-player";
import { Client, DIService, tsyringeDependencyRegistryEngine } from "discordx";
import { container } from "./shared/Container";
import { Logger } from "./shared/Logger";
import { RequestContext } from "./shared/RequestContext";
import { PlayerEvents } from "./discord/infrastructure/in/events/PlayerEvents";

const logger = new Logger("Bootstrap");
const discordLogger = new Logger("DiscordClient");

(async () => {
  DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);

  const guildId = process.env.DEV_GUILD_ID;

  const bot = new Client({
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.GuildVoiceStates,
    ],
    // En desarrollo usa un servidor específico para registros instantáneos.
    // En producción omite botGuilds para comandos globales.
    ...(guildId ? { botGuilds: [guildId] } : {}),
    silent: false,
    logger: {
      log: (...args) => String(args[0]).trim() && discordLogger.log(args[0], ...args.slice(1)),
      info: (...args) => String(args[0]).trim() && discordLogger.info(args[0], ...args.slice(1)),
      warn: (...args) => String(args[0]).trim() && discordLogger.warn(args[0], ...args.slice(1)),
      error: (...args) => String(args[0]).trim() && discordLogger.error(args[0], ...args.slice(1)),
    },
  });

  const player = new Player(bot);
  await player.extractors.register(YoutubeExtractor, {});
  await player.extractors.loadMulti(DefaultExtractors);
  container.registerInstance("MusicPlayer", player);
  container.resolve(PlayerEvents);

  bot.once("clientReady", async () => {
    await bot.initApplicationCommands();
    logger.info(`Sistema operando. Conectado como: ${bot.user?.tag}`);
  });

  bot.on("interactionCreate", async (interaction) => {
    if (!interaction.guildId) {
      await bot.executeInteraction(interaction);
    } else {
      await RequestContext.run(
        { guildId: interaction.guildId, userId: interaction.user.id },
        () => bot.executeInteraction(interaction)
      );
    }

    if (interaction.isCommand() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "Este comando no está disponible o ya no existe.",
        flags: MessageFlags.Ephemeral,
      });
    }
  });

  try {
    await importx(`${dirname(import.meta.url)}/discord/infrastructure/in/**/*.{ts,js}`);

    const token = process.env.BOT_TOKEN;
    if (!token) throw new Error("BOT_TOKEN no definido en el archivo .env");

    await bot.login(token);
  } catch (error) {
    logger.error("Error fatal al iniciar el bot", error);
  }
})();
