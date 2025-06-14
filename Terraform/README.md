# Terraform Configuration for Docker Infrastructure

**Note:** The primary and most up-to-date instructions for using Terraform with this project can be found in the main [README.md](../README.md#running-with-docker-via-terraform) at the root of the project. This document serves as a quick command reference when you are already working within the `Terraform` directory.

### Ensure the following tools and services are installed and configured:

1. **Docker**  
    - Docker must be installed and running on your system.

2. **Terraform**  
    - Terraform must be installed to manage the infrastructure.

3. **AWS Configure**  
    - AWS CLI: Configured via `aws configure` to provide credentials for AWS. The Terraform setup in this project is pre-configured to use AWS S3 and DynamoDB for backend state storage (these AWS resources may need to be created separately as detailed in the main project README).
    - Run:  
      ```sh
      aws configure
      ```

## Managing the Docker Infrastructure Using Terraform

Deploy, manage, and tear down the Docker infrastructure with Terraform:

1. **Initialize the Terraform Configuration**  
    - This downloads necessary providers, modules, and configures the backend.  
    - Run:  
      ```sh
      terraform init
      ```  
    - If using the AWS backend, Terraform may prompt you to migrate state. Type `yes` to proceed.

2. **Format Terraform Files**  
    - Ensure consistent formatting across your `.tf` files.  
    - Run:  
      ```sh
      terraform fmt
      ```

3. **Validate Configuration**  
    - Check for syntax errors or misconfigurations.  
    - Run:  
      ```sh
      terraform validate
      ```

4. **Create an Execution Plan**  
    - Generate a preview of the changes Terraform will make to achieve the desired state.  
    - Run:  
      ```sh
      terraform plan
      ```  
    - Review the output to ensure it aligns with your expectations.

5. **Apply the Changes**  
    - Execute the plan to deploy or update the Docker infrastructure.  
    - Run:  
      ```sh
      terraform apply
      ```  
    - Review the proposed changes and type `yes` to confirm.

6. **Access the Deployed Application**  
    - Once applied, Terraform may output an `access_url` (e.g., `http://localhost:8080`).  
    - Open this URL in a browser to interact with the deployed application.

7. **Destroy the Infrastructure**  
    - Remove all Terraform-managed resources when they’re no longer needed.  
    - Run:  
      ```sh
      terraform destroy
      ```  
    - Confirm by typing `yes` to proceed.
