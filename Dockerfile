FROM node:23.3.0-slim  AS builder

# Install pnpm globally and necessary build tools
RUN npm install -g pnpm@9.15.4 && \
    apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
    git \
    python3 \
    python3-pip \
    curl \
    node-gyp \
    ffmpeg \
    libtool-bin \
    autoconf \
    automake \
    libopus-dev \
    make \
    g++ \
    build-essential \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    openssl \
    libssl-dev libsecret-1-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set Python 3 as the default python
RUN ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app

COPY . .
# Install dependencies

RUN pnpm install

# Build the project
RUN pnpm run build && pnpm prune --prod

FROM node:23.3.0-slim
# Install runtime dependencies
RUN npm install -g pnpm@9.15.4 && \
    apt-get update && \
    apt-get install -y \
    git \
    python3 \
    ffmpeg \
    libgif7 \ 
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 写入 .env 文件
RUN echo "PORT=3003" >> .env && \
    echo "TWITTER_USERNAME=@dorismao85" >> .env && \
    echo "TWITTER_PASSWORD=Dorismao85_stellac" >> .env && \
    echo "TWITTER_EMAIL=dorismao85@gmail.com" >> .env && \
    echo "AI_API_KEY=sk-a218c7498cb747a9bf734505dba75ceb" >> .env && \
    echo "AI_MODEL=deepseek-reasoner" >> .env && \
    echo "AI_BASE_URL=api.deepseek.com" >> .env


COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/fonts ./fonts
COPY --from=builder /app/dist ./dist
# 使用非 root 用户运行应用
USER 65532:65532

EXPOSE 3003
CMD [ "pnpm", "run", "start:prod" ]