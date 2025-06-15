# Boardify

A simple, intuitive, and fully responsive Kanban board to manage your tasks efficiently, powered by modern web technologies and easily deployable via Docker and Terraform.

## Features

- **Create, Edit & Delete Tasks**  
- **Drag & Drop** task cards between columns  
- **Reordering & Prioritization** within columns  
- **Search & Filter** tasks by title or label  
- **Multiple Boards** support for different projects  
- **Dark/Light Theme** toggle  
- **Local Storage Persistence** no backend required  
- **Fully Responsive** design for desktop & mobile  

**Note:** All task data is stored locally in your browser's storage. This means your tasks are private and not shared across devices or users.

## Tech Stack

- **HTML5** – semantic markup  
- **Tailwind CSS** – utility-first styling  
- **JavaScript** – vanilla JS for logic & DOM manipulation  

## Getting Started

### Prerequisites

- **Git**  
- **Node.js** v20+  
- **pnpm** (or npm/yarn)  

### Local Development

1. **Clone the repository**  
   ```bash
   git clone https://github.com/chintanboghara/Boardify.git
   cd Boardify
   ```

2. **Install dependencies**  
   ```bash
   pnpm install
   ```

3. **Start the development server**  
   ```bash
   pnpm dev
   ```

   Your app will be running at `http://localhost:3000`.

## Docker & Terraform Deployment

To deploy Boardify locally using Docker and Terraform, follow these steps. Terraform is configured to store its state in AWS S3 & DynamoDB.

### AWS Backend Configuration

1. Create an S3 bucket and DynamoDB table for Terraform state locking.
2. Configure your AWS CLI credentials:  
   ```bash
   aws configure
   ```

### Terraform Commands

Navigate to the `Terraform/` directory:  
```bash
cd Terraform
```

1. **Initialize Terraform**  
   ```bash
   terraform init
   ```
   > Downloads providers, modules, and configures remote state.

2. **Format your .tf files**  
   ```bash
   terraform fmt
   ```

3. **Validate configuration**  
   ```bash
   terraform validate
   ```

4. **Plan infrastructure changes**  
   ```bash
   terraform plan
   ```

5. **Apply changes**  
   ```bash
   terraform apply
   ```
   > Confirm with `yes` when prompted.  
   Open the provided `access_url` (e.g., `http://localhost:8080`) in your web browser to access Boardify.

6. **Destroy infrastructure**  
   ```bash
   terraform destroy
   ```
   > Confirm with `yes` to tear down all resources. This will stop and remove the Docker container.

## Built With

* [Tailwind CSS](https://tailwindcss.com/)
* [pnpm](https://pnpm.io/)
* [Terraform](https://terraform.io/)
* [Docker](https://docker.com/)
* [AWS S3 & DynamoDB](https://aws.amazon.com/) for remote state backend
