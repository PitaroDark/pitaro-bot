import type { LoopMode, MusicProvider, NowPlayingInfo, PlayResult, QueuePage } from "../../types/Music";

export const MUSIC_USE_CASE = "MusicUseCase" as const;

export interface MusicUseCase {
  play(query: string, voiceChannelId: string, textChannelId: string): Promise<PlayResult>;
  skip(count: number): Promise<number>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  getQueue(page: number): Promise<QueuePage>;
  clearQueue(): Promise<{ removed: number }>;
  getNowPlaying(): Promise<NowPlayingInfo>;
  setVolume(level: number): Promise<void>;
  setLoopMode(mode: LoopMode): Promise<void>;
  shuffle(): Promise<void>;
  seek(position: string): Promise<void>;
  removeFromQueue(position: number): Promise<string>;
  setProvider(provider: MusicProvider): Promise<void>;
}
