# TMMR Frontend Dockerfile
# React + Vite Production Build

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install dependencies (including dev deps for build)
RUN npm install

# Copy source code
COPY . .

# Build the production bundle
RUN npm run build

# Install serve for static file serving
RUN npm install -g serve

# Expose frontend port
EXPOSE 3000

# Serve the built files
CMD ["serve", "-s", "dist", "-l", "3000"]
