# ------- Build stage -------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src
COPY public ./public

# Build TypeScript to JavaScript
RUN npm run build

# Verify build was successful
RUN test -d dist || (echo "Build failed: dist directory not created" && exit 1)

# ------- Production stage -------
FROM node:20-alpine

WORKDIR /app

# Set environment
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm install --only=production --omit=dev

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy public files if needed
COPY public ./public

# Create upload directories
RUN mkdir -p uploads/docs uploads/image uploads/media

EXPOSE 5005

# Start application
CMD ["node", "dist/server.js"]