# ─── Stage 1: Build the frontend SPA ───
FROM node:22-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies like Vite)
RUN npm ci

# Copy source code and build production assets
COPY . .
RUN npm run build

# ─── Stage 2: Production runtime image ───
FROM node:22-slim AS runner

WORKDIR /app

# Set container environment
ENV NODE_ENV=production
ENV PORT=80

# Install production dependencies only (no native modules — pure JS)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend server code
COPY server/ ./server/

# Document port (Vercel routes to 80 by default; Cloud Run injects PORT=8080)
EXPOSE 80

# Start production server
CMD ["node", "server/index.js"]
