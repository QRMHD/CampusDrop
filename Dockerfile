# ─── Stage 1: Build frontend SPA & compile dependencies ───
FROM node:22-slim AS builder

WORKDIR /app

# Install build tools needed for native compilation (better-sqlite3 / node-gyp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies like Vite)
RUN npm ci

# Copy source code and build production assets
COPY . .
RUN npm run build

# Prune devDependencies to leave only production node_modules with compiled native modules
RUN npm prune --omit=dev

# ─── Stage 2: Production runtime image ───
FROM node:22-slim AS runner

WORKDIR /app

# Set container environment
ENV NODE_ENV=production
ENV PORT=80
ENV DB_PATH=/tmp/campusdrop.db

# Copy production dependencies (including compiled better-sqlite3) from builder
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend server code
COPY server/ ./server/

# Ensure /tmp directory is present with full permissions
RUN mkdir -p /tmp && chmod 777 /tmp

# Document port (Vercel routes to 80 by default; Cloud Run injects PORT=8080)
EXPOSE 80

# Start production server
CMD ["node", "server/index.js"]
