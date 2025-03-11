# Use an official Node.js runtime as a parent image
FROM node:18 AS build

# Set the working directory inside the container
WORKDIR /app

# Copy dependency definitions
COPY package.json pnpm-lock.yaml* ./

# Install pnpm globally
RUN npm install -g pnpm

# Install app dependencies
RUN pnpm install

# Copy the rest of your app's source code
COPY . .

# Build the app (if applicable)
# RUN pnpm build

# Use a smaller base image for the final stage
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /app

# Install pnpm globally in the final stage
RUN npm install -g pnpm

# Add pnpm to PATH
ENV PATH /usr/local/share/.config/yarn/global/node_modules/.bin:$PATH

# Copy only the necessary files from the build stage
COPY --from=build /app /app

# Create a non-root user if it doesn't already exist
RUN id -u appuser &>/dev/null || adduser --disabled-password --gecos "" appuser

# Change ownership of the app directory
RUN chown -R appuser:appuser /app

# Expose the port the app runs on
EXPOSE 3000

# Use the non-root user
USER appuser

# Add pnpm to PATH for appuser
ENV PATH /usr/local/share/.config/yarn/global/node_modules/.bin:$PATH

# Start the app
CMD ["pnpm", "dev"]
