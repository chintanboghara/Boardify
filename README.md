# Boardify

[![Build and Push Docker Image](https://github.com/chintanboghara/Boardify/actions/workflows/docker-publish.yml/badge.svg?branch=main)](https://github.com/chintanboghara/Boardify/actions/workflows/docker-publish.yml)

Boardify is a simple yet powerful Kanban board application designed for efficient task management. Organize your workflow seamlessly with intuitive drag-and-drop, task prioritization, multiple board support, and a modern dark/light theme, all powered by local storage for persistence.

## Features

-   **Create Tasks:** Add new tasks with detailed information.
-   **Edit & Delete Tasks:** Modify or remove tasks as needed.
-   **Drag & Drop:** Easily move tasks between different status boards (e.g., To Do, In Progress, Done).
-   **Task Reordering:** Change the vertical order of tasks within a single board.
-   **Task Prioritization:** Assign priorities (e.g., Low, Medium, High) to tasks for better organization.
-   **Search & Filter:** Quickly find specific tasks using the built-in search functionality.
-   **Task Breakdown (Subtasks):** Break down complex tasks into smaller, manageable subtasks. Each subtask can be marked as complete, and progress is visually displayed on the parent task card. Subtasks are managed within the task editing modal.
-   **Task Activity Log:** Keep track of changes to your tasks. Each task now has an activity log that records actions like creation, updates to key fields (title, description, priority, etc.), and subtask modifications. Logs are viewable within the task editing modal.
-   **File Attachments:** Attach small files (e.g., images, small documents up to 1MB) to tasks. Files are stored directly in your browser's `localStorage` as Data URLs, allowing for local persistence without a backend server. Metadata (file name, type, size, attachment date) is also stored and displayed. Attachments can be removed from tasks. (Note: Due to `localStorage` limitations, this feature is suitable for small files only and not for large or sensitive data.)
-   **Markdown in Descriptions:** Task descriptions now support Markdown formatting, allowing for richer text including headings, lists, bold/italic text, links, and code snippets. The Markdown is rendered on task cards for easy viewing. A hint and a link to a syntax guide are provided in the task modal.
-   **Multiple Board Support:** Manage several distinct Kanban boards simultaneously.
-   **Visual Due Date Indicators:** Tasks are visually highlighted if they are overdue, due today, or due soon (within the next 3 days), helping users prioritize effectively.
-   **Sort by Due Date:** Each board allows tasks to be sorted by their due date in ascending or descending order, providing flexibility in task organization.
-   **Dark/Light Theme:** Toggle between dark and light modes for comfortable viewing.
-   **Local Storage Persistence:** Your tasks and board configurations are stored locally in your browser for quick access and persistence across sessions.
-   **Fully Responsive Design:** Enjoy a seamless experience whether you're on a desktop, tablet, or mobile device.

## Tech Stack

-   [HTML5](https://developer.mozilla.org/en-US/docs/Web/HTML): For structuring the application content.
-   [Tailwind CSS](https://tailwindcss.com/): A utility-first CSS framework for rapid UI development.
-   [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript): For core application logic and interactivity.
-   [Git](https://git-scm.com/): For version control.
-   [Docker](https://www.docker.com/): For containerizing the application.
-   [Terraform](https://www.terraform.io/): For managing the Docker infrastructure as code (optional).

## Getting Started

There are several ways to run Boardify:

1.  **From Source Code (for Development)**
2.  **Using Docker Directly**
3.  **Using Docker via Terraform**

### 1. Running from Source Code

This method is ideal if you want to modify the code or contribute to the project.

#### Prerequisites

Ensure you have the following installed on your machine:

-   [Git](https://git-scm.com/)
-   [Node.js](https://nodejs.org/en) (v20 or higher recommended)
-   [pnpm](https://pnpm.io/) (Fast, disk space efficient package manager)

#### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/chintanboghara/Boardify.git
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd Boardify
    ```

3.  **Install dependencies:**
    ```bash
    pnpm install
    ```

4.  **Start the development server:**
    ```bash
    pnpm dev
    ```
    This will start the Vite development server.

5.  **Access the app:**
    Visit [http://localhost:5173](http://localhost:5173) in your browser.

6.  **Run tests:**
    To execute the automated tests, run:
    ```bash
    pnpm test
    ```

### 2. Running with Docker Directly

This method uses the pre-built Docker image available on GitHub Packages. It's a quick way to run the application without needing Node.js or pnpm installed locally.

#### Prerequisites

-   [Docker](https://www.docker.com/get-started) installed and running.

#### Steps

1.  **Pull the Docker image:**
    ```bash
    docker pull chintanboghara/boardify:latest
    ```

2.  **Run the Docker container:**
    ```bash
    docker run -d -p 8080:80 --name boardify chintanboghara/boardify:latest
    ```
    *   `-d`: Run the container in detached mode (in the background).
    *   `-p 8080:80`: Map port 8080 on your host machine to port 80 inside the container (where Nginx serves the application). You can use other host ports if 8080 is unavailable (e.g., `-p 5173:80` to match the `docker-compose.yml` configuration).
    *   `--name boardify`: Assign a name to the container for easier management.

3.  **Access the app:**
    Visit [http://localhost:8080](http://localhost:8080) in your browser.

4.  **To stop the container:**
    ```bash
    docker stop boardify
    ```

5.  **To remove the container:**
    ```bash
    docker rm boardify
    ```

### 3. Running with Docker via Terraform

This method uses Terraform to manage the Docker container lifecycle (create, update, destroy). It's useful if you prefer managing infrastructure as code, even for local Docker containers. The provided configuration uses AWS S3 and DynamoDB for backend state management, which is robust but requires AWS setup.

#### Prerequisites

1.  **Docker:** Must be installed and running.
2.  **Terraform:** Must be installed ([Installation Guide](https://learn.hashicorp.com/tutorials/terraform/install-cli)).
3.  **AWS CLI & Credentials (Optional but required for the default backend):**
    *   If you intend to use the provided AWS S3/DynamoDB backend for Terraform state:
        *   Install [AWS CLI](https://aws.amazon.com/cli/).
        *   Configure AWS credentials by running `aws configure`. You'll need an AWS account and potentially need to create an S3 bucket and DynamoDB table manually first (Terraform expects them to exist for the backend configuration).
    *   **Alternative (Local State):** If you don't want to use AWS, you can comment out or remove the `backend "s3"` block in your Terraform configuration file (e.g., `main.tf`). Terraform will then use local state files instead.

#### Managing the Docker Container with Terraform

*(Ensure you are in the directory containing the Terraform `.tf` files within the cloned project)*

1.  **Initialize Terraform:**
    Downloads necessary providers and configures the backend (if specified).
    ```bash
    terraform init
    ```
    *   If using the AWS backend for the first time, Terraform might ask if you want to copy existing state. Follow the prompts. If the S3 bucket or DynamoDB table doesn't exist, `init` will fail.

2.  **Format Code (Optional):**
    Ensures consistent formatting.
    ```bash
    terraform fmt
    ```

3.  **Validate Configuration:**
    Checks for syntax errors.
    ```bash
    terraform validate
    ```

4.  **Plan Changes:**
    Shows what resources Terraform will create, modify, or destroy.
    ```bash
    terraform plan
    ```
    *   **Review the plan carefully** to understand the proposed actions.

5.  **Apply Changes:**
    Executes the plan to create and start the Docker container.
    ```bash
    terraform apply
    ```
    *   Terraform will show the plan again and ask for confirmation. Type `yes` to proceed.

6.  **Access the Deployed Application:**
    After applying, Terraform might output an `access_url` (e.g., `http://localhost:8080` - depending on your Terraform configuration). Open this URL in your browser.

7.  **Destroy Infrastructure:**
    Stops and removes the Docker container managed by Terraform.
    ```bash
    terraform destroy
    ```
    *   Confirm by typing `yes`. This is crucial to clean up resources when you're done.
