import { Player, QueueRepeatMode, useQueue } from "discord-player";
import { inject, injectable } from "tsyringe";
import { MusicUseCase } from "../../domain/ports/in/MusicUseCase";
import type { LoopMode, MusicProvider, NowPlayingInfo, PlayResult, QueuePage, QueueTrack } from "../../domain/types/Music";
import { RequestContext } from "../../../shared/RequestContext";
import {
  EmptyQueueError,
  InvalidSeekPositionError,
  NotInVoiceChannelError,
  NotPlayingError,
  SeekExceedsDurationError,
  TrackNotFoundError,
} from "../../domain/errors/MusicErrors";
import { DEFAULT_PAGE_SIZE, LOOP_MODE } from "../../../shared/Constants";

@injectable()
export class MusicService implements MusicUseCase {
  private readonly guildProviders = new Map<string, MusicProvider>();

  constructor(
    @inject("MusicPlayer") private readonly player: Player
  ) {}

  public async play(query: string, voiceChannelId: string, textChannelId: string): Promise<PlayResult> {
    query = this.normalizeQuery(query);
    if (!query.trim()) throw new TrackNotFoundError(query);

    const channel = this.player.client.channels.cache.get(voiceChannelId);
    if (!channel?.isVoiceBased()) throw new NotInVoiceChannelError();

    const guildId = RequestContext.guildId;
    const provider = this.guildProviders.get(guildId) ?? "youtube";
    const queued = useQueue(guildId)?.isPlaying() ?? false;

    const { track } = await this.player.play(channel, query, {
      requestedBy: RequestContext.userId,
      searchEngine: provider === "spotify" ? "spotifySearch" : "youtubeSearch",
      nodeOptions: {
        selfDeaf: true,
        volume: 80,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 5000,
        leaveOnEnd: true,
        leaveOnEndCooldown: 60000,
        metadata: { textChannelId },
      },
    });

    if (!track) throw new TrackNotFoundError(query);
    return { title: track.title, queued };
  }

  public async skip(count: number): Promise<number> {
    const queue = useQueue(RequestContext.guildId);
    if (!queue?.isPlaying()) throw new NotPlayingError();

    const toRemove = Math.min(count - 1, queue.tracks.size);
    for (let i = 0; i < toRemove; i++) {
      queue.node.remove(0);
    }
    queue.node.skip();

    return toRemove + 1;
  }

  public async pause(): Promise<void> {
    const queue = useQueue(RequestContext.guildId);
    if (!queue?.isPlaying()) throw new NotPlayingError();
    queue.node.pause();
  }

  public async resume(): Promise<void> {
    const queue = useQueue(RequestContext.guildId);
    if (!queue) throw new NotPlayingError();
    queue.node.resume();
  }

  public async stop(): Promise<void> {
    const queue = useQueue(RequestContext.guildId);
    if (!queue) throw new NotPlayingError();
    queue.delete();
  }

  public async getQueue(page: number): Promise<QueuePage> {
    const queue = useQueue(RequestContext.guildId);
    const allTracks = queue?.tracks.toArray() ?? [];
    const totalTracks = allTracks.length;
    const totalPages = Math.max(1, Math.ceil(totalTracks / DEFAULT_PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * DEFAULT_PAGE_SIZE;

    const tracks: QueueTrack[] = allTracks.slice(start, start + DEFAULT_PAGE_SIZE).map((track, i) => ({
      position: start + i + 1,
      title: track.title,
      duration: track.duration,
      requester: track.requestedBy?.toString() ?? "Desconocido",
    }));

    return { tracks, page: safePage, totalPages, totalTracks };
  }

  public async clearQueue(): Promise<{ removed: number }> {
    const queue = useQueue(RequestContext.guildId);
    if (!queue || queue.tracks.size === 0) throw new EmptyQueueError();
    const removed = queue.tracks.size;
    queue.tracks.clear();
    return { removed };
  }

  public async getNowPlaying(): Promise<NowPlayingInfo> {
    const queue = useQueue(RequestContext.guildId);
    const track = queue?.currentTrack;
    if (!track) throw new NotPlayingError();

    const ts = queue.node.getTimestamp();

    return {
      title: track.title,
      url: track.url,
      duration: track.duration,
      elapsed: ts?.current.label ?? "0:00",
      requester: track.requestedBy?.toString() ?? "Desconocido",
    };
  }

  public async setVolume(level: number): Promise<void> {
    const queue = useQueue(RequestContext.guildId);
    if (!queue?.isPlaying()) throw new NotPlayingError();
    queue.node.setVolume(level);
  }

  public async setLoopMode(mode: LoopMode): Promise<void> {
    const queue = useQueue(RequestContext.guildId);
    if (!queue) throw new NotPlayingError();
    queue.setRepeatMode(LOOP_MODE[mode]);
  }

  public async shuffle(): Promise<void> {
    const queue = useQueue(RequestContext.guildId);
    if (!queue || queue.tracks.size === 0) throw new EmptyQueueError();
    queue.tracks.shuffle();
  }

  public async seek(position: string): Promise<void> {
    const valid = /^\d+:\d{2}$|^\d+s?$/.test(position);
    if (!valid) throw new InvalidSeekPositionError(position);

    const queue = useQueue(RequestContext.guildId);
    if (!queue?.isPlaying()) throw new NotPlayingError();

    const ms = this.toMs(position);
    if (ms >= queue.currentTrack!.durationMS) throw new SeekExceedsDurationError(position, queue.currentTrack!.duration);

    await queue.node.seek(ms);
  }

  public async removeFromQueue(position: number): Promise<string> {
    const queue = useQueue(RequestContext.guildId);
    if (!queue || queue.tracks.size === 0) throw new EmptyQueueError();

    const track = queue.tracks.at(position - 1);
    if (!track) throw new EmptyQueueError();

    queue.node.remove(track);
    return track.title;
  }

  public async setProvider(provider: MusicProvider): Promise<void> {
    this.guildProviders.set(RequestContext.guildId, provider);
  }

  private normalizeQuery(query: string): string {
    try {
      const url = new URL(query);
      if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") {
        const videoId = url.searchParams.get("v");
        if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
      }
    } catch {
      // no es una URL, se usa como búsqueda de texto
    }
    return query;
  }

  private toMs(position: string): number {
    if (position.includes(":")) {
      const [min, sec] = position.split(":").map(Number);
      return (min * 60 + sec) * 1000;
    }
    return parseInt(position.replace("s", ""), 10) * 1000;
  }
}
