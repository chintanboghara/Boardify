# Boardify

Boardify is a simple, intuitive, and fully responsive Kanban board application designed for efficient task management. It's built with modern web technologies including React, TypeScript, and Tailwind CSS. All data is stored locally in your browser's local storage, ensuring privacy and offline access.

## Features

-   **Multiple Boards:** Create and manage multiple Kanban boards to organize tasks across different projects or contexts.
-   **Customizable Boards:**
    -   Set custom background colors for boards.
    -   Set custom background images (via URL) for boards.
-   **Columns:**
    -   Create, rename, and delete columns within each board.
    -   Reorder columns via drag and drop.
    -   Set Work-In-Progress (WIP) limits for columns, with visual indicators when limits are approached or exceeded.
    -   Customize column header colors for better visual organization.
-   **Tasks:**
    -   Full CRUD operations (Create, Read, Update, Delete) for tasks.
    -   **Detailed Task Information:**
        -   Title (required)
        -   Description (optional, supports multi-line text)
        -   Labels (comma-separated for easy tagging)
        -   Due Dates (with visual indicators for overdue, due today, due soon)
        -   Priority Levels (None, Low, Medium, High, Critical) with visual cues.
        -   Subtasks (add, complete/uncomplete, delete) to break down work.
        -   Attachments (URL-based links with optional names).
        -   Cover Colors or Cover Image URLs for task cards.
    -   **Drag & Drop:** Easily move tasks between columns and reorder them within their current column. Enhanced visual feedback while dragging.
-   **Search Functionality:** Quickly find tasks across the active board by title, description, labels, or priority.
-   **Theme Customization:**
    -   Switch between Dark and Light themes.
    -   Theme preference persists in local storage.
    -   System theme preference detection on first load.
-   **Data Persistence:** All board and task data is saved locally in the browser's local storage, allowing for offline access.
-   **Responsive Design:** Seamless user experience across desktop, tablet, and mobile devices.
-   **User-Friendly Modals:** Consistent and accessible modals for creating/editing boards, columns, tasks, and for confirmations.
-   **Input Validation:** Clear feedback for required fields and invalid inputs (e.g., URLs).
-   **Docker Support:** Pre-configured Dockerfiles for both production deployment and development environments using Docker Compose.

## Tech Stack

-   **React 18+** with TypeScript
-   **Tailwind CSS** for styling (via CDN in `index.html`, with extendable config)
-   **Vite** for frontend tooling (dev server, build process)
-   **react-beautiful-dnd** for elegant drag and drop functionality
-   **uuid** for generating unique IDs for boards, columns, and tasks

## Project Structure

```
/
├── public/
│   └── vite.svg (example favicon)
├── components/
│   ├── BoardSettingsModal.tsx  # Modal for board appearance settings
│   ├── BoardView.tsx         # Main view for displaying columns and tasks
│   ├── Column.tsx            # Represents a single column
│   ├── ConfirmationModal.tsx # Generic modal for user confirmations
│   ├── Header.tsx            # Application header with navigation and controls
│   ├── IconButton.tsx        # Reusable icon button component
│   ├── InputModal.tsx        # Generic modal for single text inputs
│   ├── TaskCard.tsx          # Represents a single task card
│   └── TaskModal.tsx         # Modal for creating/editing tasks
├── contexts/
│   ├── BoardContext.tsx      # Manages all board, column, and task data and logic
│   └── ThemeContext.tsx      # Manages application theme (light/dark)
├── hooks/
│   └── useLocalStorage.ts    # Custom hook for persisting state to local storage
├── App.tsx                   # Main application component
├── constants.ts              # Application-wide constants (storage keys, defaults)
├── icons.tsx                 # SVG icon components
├── index.html                # Main HTML entry point
├── index.tsx                 # React application entry point
├── package.json              # Project dependencies and scripts
├── README.md                 # This file
├── tsconfig.json             # TypeScript compiler configuration
├── tsconfig.node.json        # TypeScript configuration for Node.js (e.g., vite.config.ts)
├── types.ts                  # TypeScript type definitions
├── utils.ts                  # Utility functions (e.g., color contrast)
├── vite.config.ts            # Vite configuration
├── Dockerfile                # For production builds
├── Dockerfile.dev            # For development with Docker Compose
├── docker-compose.yml        # For development environment
├── .dockerignore             # Specifies files to ignore for Docker builds
└── .gitignore                # Specifies intentionally untracked files for Git
```

## Getting Started

### Prerequisites

-   Node.js (v18 or later recommended)
-   npm (comes with Node.js) or yarn (optional)

### Installation & Running Locally

1.  **Clone the repository (or extract the files):**
    ```bash
    git clone https://github.com/chintanboghara/Boardify.git
    cd Boardify 
    # If you downloaded a zip, extract it and navigate into the directory
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    This will start the Vite development server, typically at `http://localhost:3000`. It should automatically open in your default web browser.

### Building for Production

To create a production build:

```bash
npm run build
# or
# yarn build
```

This will generate static assets in the `dist` folder. You can serve these files using any static file server (e.g., `serve`, Nginx, Apache).

To preview the production build locally:
```bash
npm run preview
# or
# yarn preview
```

## Usage

### Boards
1.  **Create a Board:**
    -   If it's your first time, you'll be prompted to create a board via a modal.
    -   Otherwise, click the "Select Board" dropdown in the header and then "Create New Board". Enter a name and submit.
2.  **Select a Board:** Use the "Select Board" dropdown to switch between your existing boards.
3.  **Rename a Board:** Click the "Select Board" dropdown, then click the three-dots icon next to the board name you wish to rename, and select "Rename".
4.  **Delete a Board:** Click the "Select Board" dropdown, then click the three-dots icon next to the board name, and select "Delete". A confirmation will appear.
5.  **Board Settings (Background):**
    -   With a board active, click the "Select Board" dropdown, then the three-dots icon next to the *active* board's name, and select "Board Settings".
    -   You can set a background color using the color picker or provide a URL for a background image. Changes are saved when you click "Save Settings".

### Columns
1.  **Add a Column:** In the board view, click the "Add New Column" button on the right.
2.  **Rename a Column:** Click the pencil icon in the column header. Edit the title and press Enter or click the checkmark.
3.  **Delete a Column:** Click the trash icon in the column header. A confirmation will appear, especially if the column contains tasks.
4.  **Reorder Columns:** Click and drag a column header to move it to a new position.
5.  **Set WIP Limit:** Click the pencil icon next to the "Tasks: X / Y" text in the column sub-header. Enter a number and save.
6.  **Set Column Header Color:** Click the palette icon in the column header. Choose a color and click "Save".

### Tasks
1.  **Add a Task:** Click "Add Task" at the bottom of a column. The Task Modal will open.
2.  **Edit a Task:** Click the pencil icon on a task card. The Task Modal will open with existing task details.
3.  **Task Details in Modal:**
    -   **Title:** Required.
    -   **Description:** Optional.
    -   **Labels:** Enter comma-separated values (e.g., `bug, high-priority`).
    -   **Due Date:** Pick a date. Click the "clear" icon next to the date input to remove it.
    -   **Priority:** Select from the dropdown.
    -   **Subtasks:** Type subtask text and click "Add" or press Enter. Check/uncheck to mark completion. Delete individual subtasks.
    -   **Attachments:** Enter a URL and an optional display name. Click "Add Link".
    -   **Cover Appearance:** Choose a cover color or provide a cover image URL.
4.  **Delete a Task:** Click the trash icon on a task card. A confirmation will appear.
5.  **Drag & Drop Tasks:** Click and hold a task card to drag it to another position within the same column or to a different column.

### Other Features
-   **Search:** Use the search bar in the header to filter tasks on the active board. It searches titles, descriptions, labels, and priorities.
-   **Theme Toggle:** Click the sun/moon icon in the header to switch between light and dark themes. Your preference is saved.

## Local Storage

All board, column, and task data, as well as your theme preference and active board ID, are stored in your browser's local storage. This means:
-   Your data is private to your browser.
-   Data is not shared across different browsers or devices automatically.
-   Clearing your browser's cache/storage for this site (e.g., `localhost:3000`) will erase all your Boardify data. Exercise caution.

## Docker Support

This project includes Docker configuration for both production and development.

### Prerequisites for Docker

-   Docker installed and running on your system.
-   Docker Compose (usually included with Docker Desktop installations).

### Production Docker Image

1.  **Build the Docker Image:**
    From the project root directory, open your terminal and run:
    ```bash
    docker build -t boardify:latest .
    ```
    This command uses the `Dockerfile` (the one without `.dev` extension) to build a production-ready Nginx image that serves your built React application.

2.  **Run the Docker Container:**
    After the image is successfully built, run:
    ```bash
    docker run -d -p 8080:80 boardify
    ```
    -   `-d`: Runs the container in detached mode (in the background).
    -   `-p 8080:80`: Maps port 8080 on your host machine to port 80 inside the container (where Nginx is listening).
    The application will then be accessible at `http://localhost:8080` in your web browser.

### Development with Docker Compose

A `docker-compose.yml` file and a corresponding `Dockerfile.dev` are provided for a convenient development setup. This setup includes Hot Module Replacement (HMR), so changes to your code will reflect in the browser without a full page reload.

1.  **Start the development environment:**
    From the project root directory, run:
    ```bash
    docker-compose up
    ```
    (You can add `-d` to run in detached mode: `docker-compose up -d`)

    This command will:
    -   Build the development Docker image using `Dockerfile.dev` (if it's the first time or if the Dockerfile has changed).
    -   Start a container based on this image.
    -   Mount your local project directory into the container, allowing live code changes.
    -   Install `node_modules` within a Docker volume to persist them and avoid conflicts with local `node_modules`.
    -   Run the Vite development server, which will be accessible at `http://localhost:3000` (or the port specified in `vite.config.ts` and `docker-compose.yml`).

2.  **Stop the development environment:**
    -   If running in the foreground (without `-d`), press `Ctrl+C` in the terminal where `docker-compose up` is running.
    -   If running in detached mode or to stop and remove containers defined in the compose file:
        ```bash
        docker-compose down
        ```
        Using `docker-compose down -v` will also remove the named volumes (like the one for `node_modules`).

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