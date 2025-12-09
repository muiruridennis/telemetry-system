FROM node:22-alpine

WORKDIR /app

# Copy package files from telemetry-backend folder
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies
RUN npm ci

# Copy source code from telemetry-backend folder
COPY . .

# Expose port
EXPOSE 3000

# Development mode (hot reload)
CMD ["npm", "run", "start:dev"]