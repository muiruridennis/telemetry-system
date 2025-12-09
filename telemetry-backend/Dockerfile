FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies
RUN npm ci

# Expose port
EXPOSE 3000

# Development mode (hot reload)
CMD ["npm", "run", "start:dev"]