# syntax=docker/dockerfile:1
# Multi-stage build for production-ready React app
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Create non-root user for build stage
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy package files for dependency installation (cache layer)
COPY package.json package-lock.json* ./

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production=false

# Copy source code
COPY . .

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Build the application with increased memory for webpack
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Production stage - serve with nginx
FROM nginx:1.27-alpine AS production

# Create non-root user for nginx
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 -G nginx-user

# Copy built app from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Change ownership to non-root user
RUN chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d
    
# Create nginx.pid directory for non-root user
RUN touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

# Copy nginx configuration for non-root
COPY nginx.conf /etc/nginx/nginx.conf

# Switch to non-root user
USER nginx-user

# Expose port 8080 (non-privileged port)
EXPOSE 8080
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Development stage - serve with Vite dev server
FROM node:20-alpine AS development

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source code
COPY . .

# Change ownership and switch to non-root
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port 5173 for Vite dev server
EXPOSE 5173

# Start Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
