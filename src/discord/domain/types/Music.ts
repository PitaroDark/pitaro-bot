export type LoopMode = "off" | "track" | "queue";
export type MusicProvider = "youtube" | "spotify";

export interface PlayResult {
  title: string;
  queued: boolean;
}

export interface QueueTrack {
  position: number;
  title: string;
  duration: string;
  requester: string;
}

export interface QueuePage {
  tracks: QueueTrack[];
  page: number;
  totalPages: number;
  totalTracks: number;
}

export interface NowPlayingInfo {
  title: string;
  url: string;
  duration: string;
  elapsed: string;
  requester: string;
}
