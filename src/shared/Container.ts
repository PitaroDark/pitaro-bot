import { container } from "tsyringe";
import { MusicService } from "../discord/application/services/MusicService";
import { MUSIC_USE_CASE } from "../discord/domain/ports/in/MusicUseCase";

container.register(MUSIC_USE_CASE, { useClass: MusicService });

export { container };
