FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Production stage
FROM node:18-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S medical-ai -u 1001

# Copy built application
COPY --from=builder --chown=medical-ai:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=medical-ai:nodejs /app/dist ./dist
COPY --from=builder --chown=medical-ai:nodejs /app/package.json ./package.json

# Create log directory
RUN mkdir -p /app/logs && chown medical-ai:nodejs /app/logs

USER medical-ai

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {if(r.statusCode === 200) process.exit(0); process.exit(1)}).on('error', () => process.exit(1))"

# Start application
CMD ["node", "dist/index.js"]