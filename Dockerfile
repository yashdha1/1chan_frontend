# dev stage

FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


# build stage

FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
ARG AUTH_URL=http://kong:8000
ARG POST_URL=http://kong:8000
ARG FEED_URL=http://kong:8000
ARG NOTIF_URL=http://kong:8000
ENV AUTH_URL=$AUTH_URL
ENV POST_URL=$POST_URL
ENV FEED_URL=$FEED_URL
ENV NOTIF_URL=$NOTIF_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# production stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production 
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
ARG AUTH_URL=http://kong:8000
ARG POST_URL=http://kong:8000
ARG FEED_URL=http://kong:8000
ARG NOTIF_URL=http://kong:8000
ENV AUTH_URL=$AUTH_URL
ENV POST_URL=$POST_URL
ENV FEED_URL=$FEED_URL
ENV NOTIF_URL=$NOTIF_URL

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000
USER nextjs
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]