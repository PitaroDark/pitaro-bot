import { QueueRepeatMode } from "discord-player";
import { LoopMode } from "../discord/domain/types/Music";

export const DEFAULT_PAGE_SIZE = 10;
export const LOOP_MODE: Record<LoopMode, QueueRepeatMode> = {
  off: QueueRepeatMode.OFF,
  track: QueueRepeatMode.TRACK,
  queue: QueueRepeatMode.QUEUE,
};