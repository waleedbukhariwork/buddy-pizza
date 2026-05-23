FROM node:18-alpine AS builder
ARG NEXT_PUBLIC_API_URL=http://localhost:8080/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/shared ./packages/shared
COPY apps/rider ./apps/rider

RUN npm ci
WORKDIR /app/apps/rider
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/rider/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/rider/.next ./.next
COPY --from=builder /app/apps/rider/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000

CMD ["sh", "-c", "npm run start -- -p ${PORT:-3000}"]
