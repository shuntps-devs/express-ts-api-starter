# Multi-stage build for Node.js TypeScript application

# Multi-stage build for Node.js TypeScript application

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app/backend

# Copy package files
COPY backend/package*.json ./

# Install dependencies (skip scripts like husky prepare)
RUN npm ci --only=production --ignore-scripts && npm cache clean --force


# Development stage
FROM node:20-alpine AS development

WORKDIR /app/backend

# Install development dependencies
COPY backend/package*.json ./
RUN npm ci

# Copy backend source code
COPY backend/. .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]


# Production build stage
FROM node:20-alpine AS production-build

WORKDIR /app/backend

# Copy package files
COPY backend/package*.json ./
COPY backend/tsconfig.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY backend/src/ ./src/

# Build the application
RUN npm run build


# Production stage
FROM node:20-alpine AS production

# Create app directory
WORKDIR /app/backend

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY backend/package*.json ./

# Install only production dependencies (skip scripts like husky prepare)
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force && \
    chown -R nodejs:nodejs /app/backend

# Copy built application from build stage
COPY --from=production-build --chown=nodejs:nodejs /app/backend/dist ./dist

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
