import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { PermissionError } from "../../../shared/errors/PermissionError";
import { ValidationError } from "../../../shared/errors/ValidationError";

export class TrackNotFoundError extends NotFoundError {
  constructor(query: string) {
    super(`No encontré ninguna canción con: **${query}**`);
  }
}

export class EmptyQueueError extends ValidationError {
  constructor() {
    super("La cola está vacía, añade una canción primero.");
  }
}

export class NotInVoiceChannelError extends PermissionError {
  constructor() {
    super("Debes estar en un canal de voz para usar este comando.");
  }
}

export class NotPlayingError extends ValidationError {
  constructor() {
    super("No hay ninguna canción en reproducción.");
  }
}

export class InvalidSeekPositionError extends ValidationError {
  constructor(position: string) {
    super(`Formato de tiempo inválido: **${position}**. Usa \`1:30\` o \`90\`.`);
  }
}

export class SeekExceedsDurationError extends ValidationError {
  constructor(position: string, duration: string) {
    super(`**${position}** supera la duración de la canción (\`${duration}\`).`);
  }
}
