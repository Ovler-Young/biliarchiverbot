FROM --platform=$TARGETARCH node:current-slim AS base
LABEL org.opencontainers.image.source=https://github.com/saveweb/biliarchiverbot

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

COPY pnpm-lock.yaml ./
COPY package.json ./
FROM base AS deps
RUN pnpm fetch

FROM deps AS build
COPY . .
RUN pnpm install --offline

ENV BILIARCHIVER_WEBAPP=https://example.com/
ENV BILIARCHIVER_USERNAME=example
ENV BILIARCHIVER_API=https://example.com/
ENV BILIARCHIVER_BOT=example

RUN pnpm run build

FROM base
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/.svelte-kit/output /app/.svelte-kit/output
EXPOSE 5173
CMD ["pnpm", "dev", "--host", "--port", "5173"]