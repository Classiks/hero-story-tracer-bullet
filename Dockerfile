FROM node:24-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY components.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:24-slim AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /app

COPY --from=builder /app/.output ./.output

WORKDIR /app/.output/server
RUN npm install --omit=dev --ignore-scripts

WORKDIR /app

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
