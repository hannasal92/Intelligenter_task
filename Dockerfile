# -------------------------------
# Stage 1: Build the application
# -------------------------------
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy only dependency files first (for caching)
COPY package*.json tsconfig.json ./

# Install all dependencies (dev + prod)
# Use --frozen-lockfile for consistent builds if using package-lock.json
RUN npm ci --legacy-peer-deps

# Copy the rest of the source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build


# -------------------------------
# Stage 2: Production image
# -------------------------------
FROM node:18-alpine AS production

# Set NODE_ENV for optimization
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy only built output and necessary files
COPY --from=builder /usr/src/app/dist ./dist

# If you have other runtime assets (like .env.example or public/), copy them explicitly:
# COPY --from=builder /usr/src/app/public ./public

# Create a non-root user for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose the port
EXPOSE 3000

# Use node directly
CMD ["node", "dist/index.js"]