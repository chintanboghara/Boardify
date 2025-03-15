# Boardify

[![Build, Push, Pull and Run Docker Image](https://github.com/chintanboghara/Boardify/actions/workflows/docker-cicd.yml/badge.svg)](https://github.com/chintanboghara/Boardify/actions/workflows/docker-cicd.yml)

Boardify is a simple yet powerful Kanban board application for efficient task management. Organize your workflow with intuitive drag & drop, task prioritization, multiple board support, and a modern dark/light theme—all powered by local storage persistence.

## Features

- **Create Tasks:** Add new tasks with detailed information.
- **Edit & Delete Tasks:** Modify or remove tasks as needed.
- **Drag & Drop:** Easily reorder tasks across boards.
- **Task Reordering:** Change the order of tasks within boards.
- **Task Prioritization:** Assign priorities to tasks for better organization.
- **Search & Filter:** Quickly find tasks using the built-in search functionality.
- **Multiple Board Support:** Manage several boards simultaneously.
- **Dark/Light Theme:** Toggle between dark and light modes for comfortable viewing.
- **Local Storage Persistence:** Your tasks are stored locally for quick access.
- **Fully Responsive Design:** Enjoy a seamless experience on any device.

## Tech Stack

- [HTML5](https://developer.mozilla.org/en-US/docs/Web/HTML) – Structuring the application.
- [Tailwind CSS](https://tailwindcss.com/) – Utility-first styling.
- [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript) – Core functionality.
- [Git](https://git-scm.com/) – Version control.

## Local Development

### Prerequisites

Ensure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en) (v20+)
- [pnpm](https://pnpm.io/) (Package Manager)

### Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/chintanboghara/Boardify.git
   ```

2. **Navigate to the project directory:**

   ```bash
   cd Boardify
   ```

3. **Install dependencies:**

   ```bash
   pnpm install
   ```

4. **Start the App:**

   ```bash
   pnpm dev
   ```

Visit [http://localhost:5173](http://localhost:5173) in your browser to access the app.

## Docker CI/CD

This project includes a Docker CI/CD workflow to automate build, push, pull, and run operations. Check out the badge above for the current status.