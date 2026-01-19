# Multi-stage build for Next.js

# Stage 1: Dependencies
FROM node:20-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Prisma 클라이언트 생성 후 빌드
RUN npx prisma generate && npm run build

# Stage 3: Runner
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3005
ENV HOSTNAME=0.0.0.0

# Docker 그룹 GID는 빌드 시 ARG로 주입 (기본값: 988 - 대부분의 Linux 시스템)
ARG DOCKER_GID=988

RUN groupadd --system --gid 1001 nodejs && \
    groupadd --system --gid ${DOCKER_GID} docker && \
    useradd --system --uid 1001 --gid nodejs nextjs && \
    usermod -aG docker nextjs

# wget 설치 (healthcheck용)
RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3005/ || exit 1

CMD ["node", "server.js"]
