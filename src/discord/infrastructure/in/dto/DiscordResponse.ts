import { EmbedBuilder, type InteractionEditReplyOptions } from "discord.js";

export class DiscordResponse {
  private static readonly GREEN_COLOR = 0x57f287;
  private static readonly RED_COLOR = 0xed4245;
  private static readonly YELLOW_COLOR = 0xfee75c;
  private static readonly BLUE_COLOR = 0x5865f2;

  private constructor(private readonly embed: EmbedBuilder) {}

  public static success(description: string): DiscordResponse {
    return new DiscordResponse(
      new EmbedBuilder().setColor(this.GREEN_COLOR).setDescription(`${description}`)
    );
  }

  public static error(description: string): DiscordResponse {
    return new DiscordResponse(
      new EmbedBuilder().setColor(this.RED_COLOR).setDescription(`${description}`)
    );
  }

  public static warning(description: string): DiscordResponse {
    return new DiscordResponse(
      new EmbedBuilder().setColor(this.YELLOW_COLOR).setDescription(`${description}`)
    );
  }

  public static info(description: string): DiscordResponse {
    return new DiscordResponse(
      new EmbedBuilder().setColor(this.BLUE_COLOR).setDescription(`${description}`)
    );
  }

  public toPayload(): InteractionEditReplyOptions {
    return { embeds: [this.embed] };
  }
}
