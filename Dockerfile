# syntax=docker/dockerfile:1

# Build stage (Debian-based to avoid alpine musl quirks)
FROM node:20 AS builder
WORKDIR /app/server

# Install deps
COPY server/package*.json server/tsconfig.json ./
RUN npm install --no-audit --no-fund

# Copy source and build
COPY server/src ./src
RUN npm run build && mkdir -p dist/public && cp -r src/public/* dist/public/

# Prune dev deps for runtime
RUN npm prune --omit=dev

# Runtime stage (slim image)
FROM node:20-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app/server

COPY --from=builder /app/server/package.json ./package.json
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/dist ./dist

EXPOSE 3001
CMD ["node", "dist/index.js"]


