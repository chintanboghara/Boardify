# Boardify - Kanban Board Application

A modern Kanban board application built with React, TypeScript, and Vite.

## Docker Setup

### Development Environment

To run the application in development mode with hot reloading:

```bash
# Build and start the development container
docker-compose up boardify-dev

# Or run in detached mode
docker-compose up -d boardify-dev
```

The application will be available at `http://localhost:3000`

### Production Environment

To run the application in production mode:

```bash
# Build and start the production container
docker-compose --profile production up boardify-prod

# Or run in detached mode
docker-compose --profile production up -d boardify-prod
```

The application will be available at `http://localhost:80`

### Building Images Separately

#### Development Image
```bash
docker build -f Dockerfile.dev -t boardify:dev .
docker run -p 3000:3000 -v $(pwd):/app -v /app/node_modules boardify:dev
```

#### Production Image
```bash
docker build -f Dockerfile -t boardify:prod .
docker run -p 80:80 boardify:prod
```

## Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env.local` file in the root directory:

```
GEMINI_API_KEY=your_api_key_here
```

## Features

- Drag and drop Kanban board
- Task management
- Responsive design
- Dark/Light theme support
- Local storage persistence

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Beautiful DND
- Docker & Docker Compose