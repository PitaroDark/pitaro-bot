import { GuildQueue, Player, Track } from "discord-player";
import { inject, injectable } from "tsyringe";
import { Logger } from "../../../../shared/Logger";
import { RequestContext } from "../../../../shared/RequestContext";

const logger = new Logger("MusicPlayer");

function ctx(queue: GuildQueue): string {
  const channel = queue.channel?.name ? `#${queue.channel.name}` : "voz";
  return `[${queue.guild.name} / ${channel}]`;
}

function requester(track: Track): string {
  return track.requestedBy ? `@${track.requestedBy.username}` : "desconocido";
}

function actionUser(player: Player): string {
  try {
    const userId = RequestContext.userId;
    const username = player.client.users.cache.get(userId)?.username ?? userId;
    return `@${username}`;
  } catch {
    return "desconocido";
  }
}

@injectable()
export class PlayerEvents {
  constructor(@inject("MusicPlayer") player: Player) {
    player.events.on("queueCreate", (queue) => logger.info(`${ctx(queue)} Cola creada`));
    player.events.on("audioTrackAdd", (queue, track) =>
      logger.info(`${ctx(queue)} En cola: ${track.title} — ${requester(track)}`)
    );
    player.events.on("playerStart", async (queue, track) => {
      logger.info(`${ctx(queue)} Reproduciendo: ${track.title} — ${requester(track)}`);
      if (queue.history.tracks.size === 0) return;
      const meta = queue.metadata as { textChannelId?: string } | null;
      if (!meta?.textChannelId) return;
      const channel = player.client.channels.cache.get(meta.textChannelId);
      if (!channel?.isSendable()) return;
      await channel.send(`Ahora reproduciendo: **${track.title}**`);
    });
    player.events.on("playerSkip", (queue, track) =>
      logger.warn(`${ctx(queue)} Track saltada por ${actionUser(player)}: ${track?.title}`)
    );
    player.events.on("playerError", (queue, error) =>
      logger.error(`${ctx(queue)} Error en stream:`, error)
    );
    player.events.on("error", (queue, error) =>
      logger.error(`${ctx(queue)} Error general:`, error)
    );
    player.on("debug", (msg) => logger.debug(msg));
  }
}
