FROM node:latest AS builder

WORKDIR /app

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

FROM node:latest

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

EXPOSE 3003
CMD [ "npm", "run", "start:prod" ]