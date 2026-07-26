# ─── Build Stage ─────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

# Copy dependency files
COPY package.json package-lock.json* ./

# Install ALL dependencies
RUN npm install

# Generate Prisma client
COPY prisma/ ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate

# Copy source and build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ ./src/
RUN npm run build

# ─── Production Stage ────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Runtime dependencies
RUN apk add --no-cache openssl ca-certificates wget

# Copy package.json and install only production deps
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

# Copy Prisma schema + config for migrations/seeds
COPY prisma/ ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate

# Copy built app
COPY --from=builder /app/dist ./dist

# Copy seed file
COPY prisma/seed.ts ./prisma/seed.ts
COPY tsconfig.json ./
RUN npm install --save-dev ts-node

# Copy scripts
COPY scripts/ ./scripts/

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/demo/accounts || exit 1

CMD ["node", "dist/main.js"]
