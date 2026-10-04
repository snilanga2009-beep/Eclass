# ==============================================================================
# Multi-Stage Production Dockerfile for Class Accounting Management System (CAMS)
# ==============================================================================

# Stage 1: Build Client & Server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and package manifests
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm run install:all

# Copy source files
COPY . .

# Build Client SPA & Server TypeScript
RUN node build.cjs
RUN npm --prefix server run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install OpenSSL for Prisma engine
RUN apk add --no-cache openssl

# Copy root package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install production dependencies only
RUN npm install --omit=dev && npm install --prefix server --omit=dev

# Copy compiled files from builder
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/data ./server/data

# Generate Prisma Client in production image
RUN npx --prefix server prisma generate

# Create persistent uploads directory
RUN mkdir -p /app/server/uploads /app/server/data

EXPOSE 5000

CMD ["node", "server/dist/index.js"]
