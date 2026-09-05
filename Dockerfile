# Production Dockerfile for EmbeddedAI Copilot on Google Cloud Run
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json bun.lock* ./
RUN npm ci

# Copy application source
COPY . .

# Build Vite frontend and compile Express server into dist/server.cjs
RUN npm run build

# Prune devDependencies for a lean production image
RUN npm prune --production

# -------------------------------------------------------------
# Runtime stage
# -------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Non-root security user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built artifacts and runtime node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

USER appuser

EXPOSE 8080 3000

# Cloud Run injects PORT environment variable
CMD ["node", "dist/server.cjs"]
