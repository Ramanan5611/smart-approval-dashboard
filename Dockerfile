# Stage 1: Build the React Application
FROM node:20-alpine AS frontend-build
WORKDIR /app
# Copy package files
COPY package*.json ./
# Install dependencies
RUN npm install
# Copy all project files
COPY . .
# Build the frontend (outputs to /app/dist)
RUN npm run build

# Stage 2: Build the Node Backend
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY package*.json ./
# Reuse dependencies to speed up
RUN npm install
COPY . .
# Build the backend (outputs to /app/dist-server)
RUN npm run build:server

# Stage 3: Setup Production Environment
FROM node:20-alpine
WORKDIR /app

# Copy built frontend assets
COPY --from=frontend-build /app/dist ./dist
# Copy built backend
COPY --from=backend-build /app/dist-server ./dist-server

# Copy package.json and install production dependencies
COPY package*.json ./
RUN npm install --production

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist-server/server.js"]
