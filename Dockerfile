# Production Dockerfile for Gideon Headless Runner Daemon
# Multi-architecture: linux/amd64, linux/arm64
FROM node:24-slim AS runner

WORKDIR /app

# Install system utilities: git, curl, ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package manifests and lockfile
COPY package.json package-lock.json tsconfig.json ./
COPY packages/ ./packages/
COPY apps/hq/package.json ./apps/hq/package.json

# Install dependencies (including tsx for running daemon)
RUN npm ci

# Create workspace and evidence mount points
RUN mkdir -p /workspace /app/.gideon/evidence

ENV NODE_ENV=production
ENV WORKSPACE_ROOT=/workspace
ENV CI=true

# Start the Gideon Headless Daemon
CMD ["npx", "tsx", "packages/runner/src/daemon.ts"]
