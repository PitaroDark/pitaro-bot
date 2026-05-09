import type { CommandInteraction } from "discord.js";
import { AppError } from "../../../shared/errors/AppError";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { Logger } from "../../../shared/Logger";
import { DiscordResponse } from "./dto/DiscordResponse";

const logger = new Logger("InteractionHandler");

export class InteractionHandler {
  public static async run(
    interaction: CommandInteraction,
    fn: () => Promise<DiscordResponse>
  ): Promise<void> {
    await interaction.deferReply();

    try {
      const response = await fn();
      await interaction.editReply(response.toPayload());
    } catch (error) {
      const response = InteractionHandler.translate(error);
      await interaction.editReply(response.toPayload());
    }
  }

  private static translate(error: unknown): DiscordResponse {
    if (error instanceof ValidationError) {
      return DiscordResponse.warning(error.message);
    }

    if (error instanceof AppError) {
      return DiscordResponse.error(error.message);
    }

    logger.error("Error no controlado en interacción", error as Error);
    return DiscordResponse.error("Ocurrió un error inesperado. Inténtalo de nuevo.");
  }
}
