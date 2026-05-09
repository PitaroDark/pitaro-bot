import { useQueue } from "discord-player";
import { Logger } from "../../../../shared/Logger";
import { Discord, On, type ArgsOf, type Client } from "discordx";

const logger = new Logger("Events");

@Discord()
export class CommonEvents {
  @On()
  async voiceStateUpdate([oldState, newState]: ArgsOf<"voiceStateUpdate">, client: Client): Promise<void> {
    const forceDisconnect = oldState.member?.id === client.user?.id && !newState.channelId;
    if (forceDisconnect) {
      const queue = useQueue(oldState.guild.id);
      queue?.delete();
      logger.info(`Bot desconectado a la fuerza en: ${oldState.guild.name}`);
      return;
    }

    const botChannel = oldState.guild.members.me?.voice.channel;
    if (!botChannel) return;
    const humanMembers = botChannel.members.filter((m) => !m.user.bot);
    const isBotAlone = humanMembers.size === 0;
    if (isBotAlone) {
      const queue = useQueue(oldState.guild.id);
      queue?.delete();
      logger.info(`[${oldState.guild.name} / #${botChannel.name}] Canal vacío, desconectando`);
    }
  }

  @On()
  guildCreate([guild]: ArgsOf<"guildCreate">): void {
    logger.info(`Bot añadido al servidor: ${guild.name} (${guild.memberCount} miembros)`);
  }

  @On()
  guildDelete([guild]: ArgsOf<"guildDelete">): void {
    logger.info(`Bot removido del servidor: ${guild.name}`);
  }

  @On()
  error([error]: ArgsOf<"error">): void {
    logger.error("Error del cliente Discord:", error);
  }

  @On()
  warn([message]: ArgsOf<"warn">): void {
    logger.warn("Advertencia del cliente Discord:", message);
  }
}
