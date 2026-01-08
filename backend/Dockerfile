# TMMR Backend Dockerfile
# Node.js + Express API Server

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
