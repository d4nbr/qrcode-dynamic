# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:24-slim AS deps

RUN npm install -g pnpm@10.26.2

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma.config.ts ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:24-slim AS builder

RUN npm install -g pnpm@10.26.2

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://docker:docker@localhost:5432/qrcode_dynamic"

RUN pnpm run build

# ── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:24-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
  libvips-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

RUN mkdir -p public/uploads/templates public/uploads/wallpapers && \
    chown -R nextjs:nodejs public/uploads

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
