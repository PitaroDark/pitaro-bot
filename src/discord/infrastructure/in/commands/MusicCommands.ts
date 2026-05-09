import { ApplicationCommandOptionType, CommandInteraction, GuildMember, MessageFlags } from "discord.js";
import { Discord, Slash, SlashChoice, SlashGroup, SlashOption } from "discordx";
import { inject, injectable } from "tsyringe";
import { NotInVoiceChannelError } from "../../../domain/errors/MusicErrors";
import { MUSIC_USE_CASE, type MusicUseCase } from "../../../domain/ports/in/MusicUseCase";
import type { LoopMode, MusicProvider } from "../../../domain/types/Music";
import { DiscordResponse } from "../dto/DiscordResponse";
import { InteractionHandler } from "../InteractionHandler";

@Discord()
@SlashGroup({ name: "music", description: "Comandos de música" })
@SlashGroup("music")
@injectable()
export class MusicCommands {
  constructor(
    @inject(MUSIC_USE_CASE) private readonly musicUseCase: MusicUseCase
  ) {}

  @Slash({ name: "help", description: "Muestra todos los comandos de música disponibles" })
  async help(interaction: CommandInteraction): Promise<void> {
    await interaction.reply({
      content: [
        "## Comandos de música",
        "",
        "### Reproducción",
        "`/music play <canción o URL>` — Busca y reproduce una canción. Acepta nombre, URL de YouTube o Spotify.",
        "> Ejemplo: `/music play Lo-fi beats` · `/music play https://youtu.be/xyz`",
        "`/music skip [cantidad]` — Salta una o varias canciones. Por defecto salta 1.",
        "> Ejemplo: `/music skip` (salta 1) · `/music skip 3` (salta las próximas 3)",
        "`/music pause` — Pausa la reproducción.",
        "`/music resume` — Reanuda la reproducción pausada.",
        "`/music stop` — Detiene la música y desconecta el bot del canal de voz.",
        "`/music seek <tiempo>` — Salta a un punto exacto de la canción actual.",
        "> Ejemplo: `/music seek 1:30` (minuto 1, segundo 30) · `/music seek 90` (segundo 90)",
        "`/music restart` — Reinicia la canción actual desde el principio.",
        "",
        "### Cola",
        "`/music queue [página]` — Muestra la lista de canciones pendientes.",
        "> Ejemplo: `/music queue` (página 1) · `/music queue 2` (página 2)",
        "`/music clear` — Vacía toda la cola.",
        "`/music shuffle` — Mezcla el orden de la cola aleatoriamente.",
        "`/music remove <posición>` — Elimina la canción en la posición indicada.",
        "> Ejemplo: `/music remove 3` (elimina la canción en la posición 3 de la cola)",
        "",
        "### Información",
        "`/music nowplaying` — Muestra la canción actual con tiempo transcurrido y quién la pidió.",
        "",
        "### Ajustes",
        "`/music volume <0-100>` — Ajusta el volumen del bot.",
        "> Ejemplo: `/music volume 75` (75% del volumen máximo)",
        "`/music loop <modo>` — Cambia el modo de repetición.",
        "> Modos: `off` (sin repetición) · `track` (repite canción) · `queue` (repite cola)",
        "`/music provider <fuente>` — Cambia la fuente de búsqueda: `YouTube` o `Spotify`.",
        "> Ejemplo: `/music provider Spotify`",
        "`/music login <proveedor>` — Inicia sesión con un proveedor externo para acceder a tu biblioteca.",
        "> Ejemplo: `/music login Spotify`",
      ].join("\n"),
      flags: MessageFlags.Ephemeral,
    });
  }

  // REPRODUCCIÓN
  @Slash({ name: "play", description: "Reproduce una canción o URL" })
  async play(
    @SlashOption({
      name: "query",
      description: "Nombre de la canción o URL",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    query: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await InteractionHandler.run(interaction, async () => {
      const member = interaction.member as GuildMember | null;
      const voiceChannel = member?.voice.channel;
      if (!voiceChannel) throw new NotInVoiceChannelError();
      const result = await this.musicUseCase.play(query, voiceChannel.id, interaction.channelId);
      return result.queued
        ? DiscordResponse.info(`Añadido a la cola: **${result.title}**`)
        : DiscordResponse.success(`Reproduciendo: **${result.title}**`);
    });
  }

  @Slash({ name: "skip", description: "Salta una o varias canciones" })
  async skip(
    @SlashOption({
      name: "cantidad",
      description: "Cuántas canciones saltar (por defecto 1)",
      type: ApplicationCommandOptionType.Integer,
      required: false,
      minValue: 1,
      maxValue: 100,
    })
    count: number | null,
    interaction: CommandInteraction
  ): Promise<void> {
    await InteractionHandler.run(interaction, async () => {
      const skipped = await this.musicUseCase.skip(count ?? 1);
      return DiscordResponse.success(`Saltadas **${skipped}** canción(es).`);
    });
  }

  @Slash({ name: "pause", description: "Pausa la reproducción" })
  async pause(interaction: CommandInteraction): Promise<void> {
    await InteractionHandler.run(interaction, async () => {
      await this.musicUseCase.pause();
      return DiscordResponse.info("Reproducción pausada.");
    });
  }

  @Slash({ name: "resume", description: "Reanuda la reproducción" })
  async resume(interaction: CommandInteraction): Promise<void> {
    await InteractionHandler.run(interaction, async () => {
      await this.musicUseCase.resume();
      return DiscordResponse.info("Reproducción reanudada.");
    });
  }

  @Slash({ name: "stop", description: "Detiene la música y desconecta el bot del canal" })
  async stop(interaction: CommandInteraction): Promise<void> {
    await InteractionHandler.run(interaction, async () => {
      await this.musicUseCase.stop();
      return DiscordResponse.info("Reproducción detenida.");
    });
  }

  @Slash({ name: "restart", description: "Reinicia la canción actual desde el principio" })
  async restart(interaction: CommandInteraction): Promise<void> {
    await InteractionHandler.run(interaction, async () => {
      await this.musicUseCase.seek("0:00");
      return DiscordResponse.success("Canción reiniciada desde el principio.");
    });
  }

  @Slash({ name: "seek", description: "Salta a un punto exacto de la canción (ej: 1:30)" })
  async seek(
    @SlashOption({
      name: "posicion",
      description: "Tiempo al que saltar — formato: 1:30 o 90",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    position: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await InteractionHandler.run(interaction, async () => {
      await this.musicUseCase.seek(position);
      return DiscordResponse.success(`Saltando a **${position}**.`);
    });
  }

  // COLA DE REPRODUCCIÓN
  @Slash({ name: "queue", description: "Muestra la cola de reproducción" })
  async queue(
    @SlashOption({
      name: "pagina",
      description: "Número de página",
      type: ApplicationCommandOptionType.Integer,
      required: false,
      minValue: 1,
    })
    page: number | null,
    interaction: CommandInteraction
  ): Promise<void> {
    await InteractionHandler.run(interaction, async () => {
      const result = await this.musicUseCase.getQueue(page ?? 1);

      if (result.totalTracks === 0) {
        return DiscordResponse.info("La cola está vacía.");
      }

      const list = result.tracks
        .map((t) => `**${t.position}.** ${t.title} — \`${t.duration}\``)
        .join("\n");

      return DiscordResponse.info(
        `**Cola** (página ${result.page}/${result.totalPages}) — ${result.totalTracks} canciones\n\n${list}`
      );
    });
  }

  @Slash({ name: "clear", description: "Limpia toda la cola de reproducción" })
  async clear(interaction: CommandInteraction): Promise<void> {
    await InteractionHandler.run(interaction, async () => {
      const { removed } = await this.musicUseCase.clearQueue();
      return DiscordResponse.success(`Cola limpiada — **${removed}** canción(es) eliminadas.`);
    });
  }

  @Slash({ name: "shuffle", description: "Mezcla aleatoriamente la cola" })
  async shuffle(interaction: CommandInteraction): Promise<void> {
    await InteractionHandler.run(interaction, async () => {
      await this.musicUseCase.shuffle();
      return DiscordResponse.success("Cola mezclada aleatoriamente.");
    });
  }

  @Slash({ name: "remove", description: "Elimina una canción de la cola por su posición" })
  async remove(
    @SlashOption({
      name: "posicion",
      description: "Posición de la canción en la cola",
      type: ApplicationCommandOptionType.Integer,
      required: true,
      minValue: 1,
    })
    position: number,
    interaction: CommandInteraction
  ): Promise<void> {
    await InteractionHandler.run(interaction, async () => {
      const title = await this.musicUseCase.removeFromQueue(position);
      return DiscordResponse.success(`**${title}** eliminada de la cola.`);
    });
  }

  // INFORMACIÓN
  @Slash({ name: "nowplaying", description: "Muestra la canción en reproducción actual" })
  async nowplaying(interaction: CommandInteraction): Promise<void> {
    await InteractionHandler.run(interaction, async () => {
      const info = await this.musicUseCase.getNowPlaying();
      return DiscordResponse.info(
        `**${info.title}**\n\`${info.elapsed} / ${info.duration}\`\nPedido por: ${info.requester}`
      );
    });
  }

  // CONFIGURACIÓN
  @Slash({ name: "volume", description: "Ajusta el volumen del bot (0-100)" })
  async volume(
    @SlashOption({
      name: "nivel",
      description: "Nivel de volumen entre 0 y 100",
      type: ApplicationCommandOptionType.Integer,
      required: true,
      minValue: 0,
      maxValue: 100,
    })
    level: number,
    interaction: CommandInteraction
  ): Promise<void> {
    await InteractionHandler.run(interaction, async () => {
      await this.musicUseCase.setVolume(level);
      return DiscordResponse.success(`Volumen ajustado a **${level}%**.`);
    });
  }

  @Slash({ name: "loop", description: "Configura el modo de repetición" })
  async loop(
    @SlashChoice({ name: "Desactivado", value: "off" })
    @SlashChoice({ name: "Canción actual", value: "track" })
    @SlashChoice({ name: "Cola completa", value: "queue" })
    @SlashOption({
      name: "modo",
      description: "Modo de repetición",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    mode: LoopMode,
    interaction: CommandInteraction
  ): Promise<void> {
    await InteractionHandler.run(interaction, async () => {
      await this.musicUseCase.setLoopMode(mode);
      const labels: Record<LoopMode, string> = {
        off: "desactivado",
        track: "canción actual",
        queue: "cola completa",
      };
      return DiscordResponse.success(`Modo repetición: **${labels[mode]}**`);
    });
  }

  @Slash({ name: "provider", description: "Cambia el proveedor de música del servidor" })
  async provider(
    @SlashChoice({ name: "YouTube", value: "youtube" })
    @SlashChoice({ name: "Spotify", value: "spotify" })
    @SlashOption({
      name: "fuente",
      description: "Proveedor de música",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    source: MusicProvider,
    interaction: CommandInteraction
  ): Promise<void> {
    await InteractionHandler.run(interaction, async () => {
      await this.musicUseCase.setProvider(source);
      const labels: Record<MusicProvider, string> = { youtube: "YouTube", spotify: "Spotify" };
      return DiscordResponse.success(`Proveedor cambiado a **${labels[source]}**.`);
    });
  }

  @Slash({ name: "login", description: "Inicia sesión con un proveedor de música" })
  async login(
    @SlashChoice({ name: "Spotify", value: "spotify" })
    @SlashOption({
      name: "proveedor",
      description: "Proveedor en el que iniciar sesión",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    _provider: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await InteractionHandler.run(interaction, async () => {
      // TODO: generar URL OAuth y enviarla al usuario por DM
      return DiscordResponse.info("La autenticación con proveedores externos estará disponible próximamente.");
    });
  }
}
