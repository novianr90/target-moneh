# Build Stage
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build
RUN npm prune --production

# Production Stage
FROM node:22-alpine AS runner
WORKDIR /app

# Install curl for Coolify Healthcheck
RUN apk add --no-cache curl

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ARG PORT=3000
ENV PORT=${PORT}

CMD ["node", "build"]
