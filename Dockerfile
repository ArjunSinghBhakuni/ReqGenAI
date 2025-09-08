# Multi-stage build for production
FROM node:18-alpine AS frontend-build

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# Build backend
FROM node:18-alpine AS backend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --silent
COPY . .
RUN rm -rf frontend

# Production image
FROM node:18-alpine
WORKDIR /app

# Copy backend
COPY --from=backend-build /app .

# Copy built frontend
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 8080

CMD ["node", "app.js"]
