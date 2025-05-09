# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies including dev dependencies
RUN pnpm install --frozen-lockfile

# Install additional required dependencies
RUN pnpm add -D pino-pretty eslint-plugin-react-hooks @next/eslint-plugin-next

# Copy source code
COPY . .

# Set build arguments for environment variables
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy necessary files from builder
COPY --from=builder /app/package.json .
COPY --from=builder /app/pnpm-lock.yaml .
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Set environment variables
ENV NODE_ENV=production

# Re-declare the build arg and set it as an environment variable
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

# Expose the port
EXPOSE ${PORT:-3000}

# Start the application
CMD ["pnpm", "start"] 