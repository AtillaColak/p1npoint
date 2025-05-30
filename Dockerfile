##### DEPENDENCIES

FROM --platform=linux/amd64 node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install dependencies based on the preferred package manager

COPY package.json pnpm-lock.yaml  ./

RUN npm install -g pnpm
RUN pnpm i

##### BUILDER

FROM --platform=linux/amd64 node:20-alpine AS builder

ARG NEXT_PUBLIC_CONVEX_URL=NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_GOOGLE_API_KEY=NEXT_PUBLIC_GOOGLE_API_KEY

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN  npm i -g pnpm && SKIP_ENV_VALIDATION=1 pnpm run build

ARG CONVEX_SELF_HOSTED_URL=CONVEX_SELF_HOSTED_URL
ARG CONVEX_SELF_HOSTED_ADMIN_KEY=CONVEX_SELF_HOSTED_ADMIN_KEY

RUN pnpm convex deploy


#### RUNNER

FROM --platform=linux/amd64 gcr.io/distroless/nodejs20-debian12 AS runner
WORKDIR /app

ENV NODE_ENV=production

# ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000

CMD ["server.js"]
