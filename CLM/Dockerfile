# Base image
FROM node:20-alpine

# Working directory
WORKDIR /app

# Copy package.json first to leverage Docker cache
COPY package.json .

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Expose port 5173
EXPOSE 5173

# Start command
CMD ["npm", "run", "dev"]
