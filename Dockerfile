# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# Next standalone + pnpm often omits next's nested @swc/helpers. Copy it in.
RUN helpers="$(find /app/node_modules -type d -path '*/node_modules/@swc/helpers' | head -1)" \
	&& test -n "$helpers" \
	&& test -f "$helpers/esm/_interop_require_default.js" \
	&& find /app/.next/standalone -path '*/.pnpm/next@*/node_modules' -type d \
		-exec sh -c 'if [ ! -e "$1/@swc/helpers" ]; then cp -a "$0" "$1/@swc/helpers"; fi' "$helpers" {} \; \
	&& mkdir -p /app/.next/standalone/node_modules/@swc \
	&& if [ ! -e /app/.next/standalone/node_modules/@swc/helpers ]; then cp -a "$helpers" /app/.next/standalone/node_modules/@swc/helpers; fi

# Fail the image build if server.js exits before it can listen.
WORKDIR /app/.next/standalone
ENV PORT=3000 HOSTNAME=0.0.0.0
RUN node server.js >/tmp/standalone-boot.log 2>&1 & pid=$! \
	&& sleep 3 \
	&& if ! kill -0 "$pid" 2>/dev/null; then cat /tmp/standalone-boot.log >&2; exit 1; fi \
	&& kill "$pid" \
	&& wait "$pid" || true
WORKDIR /app

# Production stage — Next.js standalone output (no pnpm in the runner)
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
	&& adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
