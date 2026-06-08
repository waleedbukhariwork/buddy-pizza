FROM node:20-alpine AS builder
ARG NEXT_PUBLIC_API_URL=http://localhost:8080/api
ARG BACKEND_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV BACKEND_URL=$BACKEND_URL
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/shared ./packages/shared
COPY apps/admin ./apps/admin

RUN npm ci
WORKDIR /app/apps/admin
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/admin/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next ./.next
COPY --from=builder /app/apps/admin/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000

CMD ["sh", "-c", "npm run start -- -p ${PORT:-3000}"]
