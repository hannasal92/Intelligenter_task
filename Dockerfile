# Stage 1: Build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json tsconfig.json ./

# Install all dependencies (dev + prod)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /usr/src/app/dist ./dist

# Expose the port your app uses
EXPOSE 3000

# Start the app
CMD ["node", "dist/index.js"]