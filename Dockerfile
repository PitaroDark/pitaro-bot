# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:lts-bookworm-slim AS build-runner

WORKDIR /tmp/app

# Build tools needed to compile @discordjs/opus from source on ARM64
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    python3 build-essential libtool autoconf automake \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN YOUTUBE_DL_SKIP_DOWNLOAD=true pnpm install --frozen-lockfile

COPY src ./src
COPY tsconfig.json .
RUN pnpm run build

# ── Production stage ───────────────────────────────────────────────────────────
FROM node:lts-bookworm-slim AS prod-runner

WORKDIR /app

# ffmpeg: sistema en lugar de ffmpeg-static (ARM64 más confiable)
# tini: manejo correcto de señales (SIGTERM/SIGINT) para shutdown graceful
# python3/pip: necesario para instalar yt-dlp actualizado (apt suele tener versión antigua)
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    ffmpeg tini python3 python3-pip \
    && pip3 install --break-system-packages --no-cache-dir yt-dlp \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=build-runner /tmp/app/package.json /tmp/app/pnpm-lock.yaml /tmp/app/pnpm-workspace.yaml ./
RUN YOUTUBE_DL_SKIP_DOWNLOAD=true pnpm install --frozen-lockfile --prod

COPY --from=build-runner /tmp/app/build ./build

ENV NODE_ENV=production
# Apunta youtube-dl-exec al yt-dlp del sistema en lugar de descargar un binario propio
ENV YOUTUBE_DL_PATH=/usr/bin/yt-dlp

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "build/main.js"]
