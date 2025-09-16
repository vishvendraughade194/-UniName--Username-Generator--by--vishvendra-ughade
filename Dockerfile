# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Install server dependencies (works with or without lockfile)
COPY server/package*.json server/tsconfig.json ./server/
RUN cd server && if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi

# Copy source
COPY server/src ./server/src

# Build
RUN cd server && npm run build && mkdir -p dist/public && cp -r src/public/* dist/public/

# Runtime image
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app/server

# Only copy runtime files
COPY --from=base /app/server/package.json ./package.json
COPY --from=base /app/server/node_modules ./node_modules
COPY --from=base /app/server/dist ./dist

EXPOSE 3001
CMD ["node", "dist/index.js"]


