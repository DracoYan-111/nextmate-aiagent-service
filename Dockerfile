# Build Stage
FROM node:20-slim AS builder

WORKDIR /app

# Install system dependencies required for canvas
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libpng-dev \
    libgif-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install -g pnpm@latest

COPY . .

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

RUN pnpm run build

# Runtime Stage
FROM node:20-slim

WORKDIR /app

# Install runtime dependencies for canvas
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango1.0-0 \
    libjpeg62-turbo \
    libpng16-16 \
    libgif7 \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@latest

# Copy necessary files from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/canvas/build ./node_modules/canvas/build

# Copy .env file
EXPOSE 3003
CMD ["pnpm", "run", "start:prod"]
