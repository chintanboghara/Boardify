# Use an official Node runtime as a parent image
FROM node:18

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory in the container
WORKDIR /app

# Copy package files and lock file to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Install project dependencies
RUN pnpm install

# Copy all project files into the container
COPY . .

# Expose the port on which the app runs
EXPOSE 3000

# Start the development server
CMD ["pnpm", "dev"]
