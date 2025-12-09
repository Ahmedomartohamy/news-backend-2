# Multi-stage build for smaller image size

# Stage 1: Build
FROM node:24-alpine AS builder

# Build arguments
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

WORKDIR /app

# Set environment for build
ENV DATABASE_URL=$DATABASE_URL

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:24-alpine AS production

# Build arguments
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV DATABASE_URL=$DATABASE_URL
ENV PATH=/app/node_modules/.bin:$PATH

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/server.js"]