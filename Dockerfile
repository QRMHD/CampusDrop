# ─── Stage 1: Build the frontend SPA ───
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies like Vite)
RUN npm ci

# Copy source code and build production assets
COPY . .
RUN npm run build

# ─── Stage 2: Production runtime image ───
FROM node:20-slim AS runner

WORKDIR /app

# Set container environment
ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=/app/data/campusdrop.db

# Install tools needed for native sqlite compilation if necessary
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Remove build tools to keep image lightweight and secure
RUN apt-get purge -y --auto-remove python3 make g++

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend server code
COPY server/ ./server/

# Create a persistent data directory owned by the non-root node user
RUN mkdir -p /app/data && chown -R node:node /app

# Run as non-root user (Cloud Run & container security standard)
USER node

# Document port (Cloud Run sets process.env.PORT=8080 dynamically)
EXPOSE 8080

# Start production server
CMD ["node", "server/index.js"]
