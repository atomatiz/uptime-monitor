# Uptime Monitor

A robust, enterprise-grade uptime monitoring service built with NestJS and Domain-Driven Design principles.

## Overview

Uptime Monitor is a sophisticated application designed to monitor availability of multiple websites, automatically detect downtime, and take corrective actions such as restarting host servers across multiple cloud providers (AWS, GCP, Azure, Oracle Cloud and Custom Providers such as Dedicated Server, Kubernetes, Docker, PM2, ...). The system follows a clean Domain-Driven Design architecture with proper separation of concerns and robust error handling.
Live endpoints:

- **Vietnam Staging**: [https://vn-staging-uptime-monitor.toanphan.me](https://vn-staging-uptime-monitor.toanphan.me)
- **United States Staging**: [https://us-staging-uptime-monitor.toanphan.me](https://us-staging-uptime-monitor.toanphan.me)
- **Vietnam Preprod**: [https://vn-preprod-uptime-monitor.toanphan.me](https://vn-preprod-uptime-monitor.toanphan.me)
- **United States Preprod**: [https://us-preprod-uptime-monitor.toanphan.me](https://us-preprod-uptime-monitor.toanphan.me)
- **Vietnam Production**: [https://vn-uptime-monitor.toanphan.me](https://vn-uptime-monitor.toanphan.me)
- **United States Production**: [https://us-uptime-monitor.toanphan.me](https://us-uptime-monitor.toanphan.me)

## Features

- **Automated Website Monitoring**: Checks website availability at configurable intervals
- **Multi-Cloud Support**: Manages hosts across AWS, GCP, Azure,Oracle Cloud and Custom Providers such as Dedicated Server, Kubernetes, Docker, PM2, ...
- **Intelligent Restart Logic**: Automatically restarts hosts when websites go down
- **Comprehensive Notification System**: Sends alerts via Email, SMS, and Webhooks with internationalization support
- **Manual Intervention Handling**: Escalates issues when automatic recovery fails
- **Downtime Tracking**: Records and reports on website downtime metrics
- **Fault Tolerance**: Graceful degradation when services are unavailable
- **Scheduled Tasks**: Configurable monitoring intervals with cron-based scheduling
- **Multinational Deployment**: Supports deployment across multiple countries with tailored configurations (initialized for Vietnam and United States)
- **Cross-Environment Deployment**: Enables seamless operation across staging, preprod, and production environments with environment-specific settings

## Tech Stack

### Core Framework

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript

### Architecture

- **Domain-Driven Design** - Clean separation of domain, application, and infrastructure layers
- **CQRS Pattern** - Command Query Responsibility Segregation for better separation of concerns
- **Event-Driven Architecture** - Domain events for loose coupling between components
- **Repository Pattern** - Abstraction over data sources

### Cloud Providers

- [AWS SDK](https://aws.amazon.com/sdk-for-javascript/) - For AWS EC2 instance management
- [Google Cloud Compute](https://cloud.google.com/nodejs/docs/reference/compute/latest) - For GCP instance management
- [Azure Compute Management](https://www.npmjs.com/package/@azure/arm-compute) - For Azure VM management
- [Oracle Cloud Infrastructure SDK](https://www.npmjs.com/package/oci-sdk) - For OCI instance management

### Notification Services

- [Nodemailer](https://nodemailer.com/) - For email notifications
- [Twilio](https://www.twilio.com/) - For SMS notifications
- HTTP/Webhook - For custom integrations

### Monitoring & Observability

- [Sentry](https://sentry.io/) - Error tracking and performance monitoring
- [Winston](https://github.com/winstonjs/winston) - Logging

### Messaging & Event Streaming

- [Kafka](https://kafka.apache.org) - Distributed event streaming platform for real-time data processing
- [RabbitMQ](https://www.rabbitmq.com) - Message broker for reliable message queuing

### HTTP Client

- [Axios](https://axios-http.com) - Promise based HTTP client for making API requests, browser and node.js

### Scheduling

- [NestJS Schedule](https://docs.nestjs.com/techniques/task-scheduling) - Task scheduling
- [Cron](https://github.com/kelektiv/node-cron) - Cron job scheduling

### Deployment & Orchestration

- [Kubernetes](https://kubernetes.io/) - Container orchestration for scalable and resilient deployments
- [Docker](https://www.docker.com/) - Container orchestration for scalable and resilient deployments
- [Helm](https://helm.sh/) - Package manager for Kubernetes to simplify deployment and configuration management
- [GitHub Actions](https://github.com/features/actions) - CI/CD automation and SonarQube integration

### Secrets Management

- [HashiCorp Vault](https://www.vaultproject.io/) - Secure storage and management of sensitive data like API keys, tokens, and credentials

### Code Quality

- [SonarQube](https://www.sonarsource.com) - Static code analysis and quality assurance
- [Husky](https://typicode.github.io/husky) - Git hooks for pre-commit and pre-push checks
- [ESLint](https://eslint.org) - Linting for TypeScript and JavaScript
- [Prettier](https://prettier.io) - Code formatting

## Getting Started

### Prerequisites

- Node.js (v22 or higher)
- NPM (v11 or higher)
- npm or yarn
- Access to cloud provider accounts or commands (for host restart functionality and host transitional status check functionality)
- Notification service credentials (Email, SMS)

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/atomatiz/uptime-monitor.git
    cd uptime-monitor
    ```
2. Install dependencies:
    ```bash
    npm install
    # or
    yarn
    ```
3. Configure environment variables:
    ```bash
    cp .env.example .env.*
    # * represents the environment such as development, staging, prerod, production,...
    # Edit .env.* with your configuration details
    ```

### Running the Application

1. Start in development mode:
    ```bash
    npm run start:dev
    # or
    yarn start:dev
    ```
2. Start in production mode:
    ```bash
    npm run build
    npm run start:prod
    # or
    yarn build
    yarn start:prod
    ```

## Messaging Infrastructure Setup (Docker + Kubernetes)

This guide provides the implementation to set up **Kafka** and **RabbitMQ** using **Docker Compose** for local development, and how to deploy them to **Kubernetes**.

### Docker Compose Setup

#### Start Services

```bash
cd infra
docker compose up -d
```

or

```bash
cd infra
docker compose up -d zookeper kafka
```

or

```bash
cd infra
docker compose up -d rabbitmq
```

#### Stop Services

```bash
cd infra
docker compose stop <service-name>
```

or

```bash
cd infra
docker compose stop
```

#### Remove Services

```bash
cd infra
docker compose rm <service-name>
```

or

```bash
cd infra
docker compose down
```

### Kubernetes Deployment

Apply the essential defined deployment files for K8S:

```bash
kubectl apply -f deployment.yaml
```

## Configuration

The application is configured through environment variables. Key configuration options include:

- `APP_NAME`: The name of the application during runtime of application
- `WEBSITE_DOWNTIME_THRESHOLD`: The duration (in milliseconds) before a website is considered officially down
- `HOST_STARTUP_THRESHOLD`: The maximum time (in milliseconds) a host will attempt to bring the website fully online
- `HOST_RESTART_ATTEMPTS`: The number of times a host will attempt to restart before considering manual intervention
- `API_RETRY_ATTEMPTS`: The number of retry attempts for API requests tracking website status before giving up
- `API_TOKEN`: The token used to access specific endpoints/APIs that require authentication
- `NOTIFICATION_AVATAR_URL`: The default URL for the avatar used in Discord notifications if needed
- `JWT_SECRET_KEY`: The secret key used for signing and verifying JWT tokens of APIs authentication (can ignore - not included in the current development phrase)
- `CSRF_SECRET_KEY`: The secret key used to protect against CSRF attacks (can ignore - not included in the current development phrase)
- `PORT`: The port on which the application runs (default: 8001)
- `ENABLE_SCHEDULING`: Enable/disable the scheduling system (default: false)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `LANG_CODE`: Language code for notifications (default: 'en')
- `TIMEZONE`: Timezone for date/time formatting in notifications (default: 'UTC')
- `ALLOWED_ORIGINS`: Cors origin endpoints that are allowed to interact with this application
- `SENTRY_DNS` && `SENTRY_AUTH_TOKEN`: Error and performance tracking (edit script `sentry:sourcemaps` in `packages.json` with specified project)
- `SWAGGER_NAME` && `SWAGGER_PASS`: The username and password for accessing the Swagger UI (API documentation)
- Cloud provider credentials (AWS, GCP, Azure, OCI)
- Custom Host provider commands (Dedicated Server, Kubernetes, Docker, PM2, ...)
- Queue provider credentials (Kafka, RabbitMQ)
- Notification service credentials (Email, SMS)
  See `.env.example`, `common/configs/system.config.ts` and `common/configs/env.config.ts` for a complete list of configuration options.

### Custom Host Configuration

For the `custom` host provider (e.g., Dedicated Servers, Kubernetes, Docker, PM2), define:

- `WEBSITE_<ID>_CUSTOM_RESTART_COMMAND`: Command to restart the host.
- `WEBSITE_<ID>_CUSTOM_CHECK_TRANSITIONAL_STATUS_COMMAND`: Command to check restarting status (outputs "true" or "false").

#### Example

```bash
WEBSITE_1_HOST_PROVIDER=custom
WEBSITE_1_CUSTOM_RESTART_COMMAND=ssh user@example.com "kubectl rollout restart deployment/my-app -n my-namespace && echo 'Deployment restart initiated'"
WEBSITE_1_CUSTOM_CHECK_TRANSITIONAL_STATUS_COMMAND=ssh user@example.com "kubectl get pod -n my-namespace -l app=my-app -o jsonpath='{.items[0].status.phase}' | grep -q 'Running' && echo 'false' | echo 'true'"
```

#### Security Note

Avoid dangerous patterns in commands (e.g., `;`, `&`, `|` outside quotes, or `exec`, `eval`) to prevent errors. The system rejects:

- Separators like `cmd1; cmd2` (use `"cmd1 && cmd2"` instead).
- Risky keywords (`exec`, `sh`).
- Commands over 500 characters or empty.

#### Invalid Example

```bash
WEBSITE_1_CUSTOM_RESTART_COMMAND=ssh user@example.com "sudo systemctl restart my-service; rm -rf /"  # Rejected
```

Test commands locally first. Rejected commands trigger errors and log warnings.

### Set Up `.yarnrc.yml` with Yarn Token

The app requires a valid Yarn registry token `YARN_TOKEN` in `.yarnrc.yml` to authenticate with `registry.yarnpkg.com` and interact with the application. Use this method:

#### Use an Environment Variable

Manually set the token via an environment variable:

1. Generate a Token:

- Log in to [npmjs.com](https://www.npmjs.com/).
- Go to Profile > Access Tokens > Generate New Token (Classic Token, read-only or read-and-write).
- Copy the token (e.g., npm_xxxxxxxxxxxxxxxx).

2. Set the Environment Variable:

- In your shell:
    ```bash
    export YARN_TOKEN=npm_xxxxxxxxxxxxxxxx
    ```
- In `.env.*` (ensure your app loads it, e.g., via `@nestjs/config`):
    ```text
    YARN_TOKEN=npm_xxxxxxxxxxxxxxxx
    ```
- In `.zshrc`, `.bashrc` or `.bash_profile`:
    ```text
    YARN_TOKEN=npm_xxxxxxxxxxxxxxxx
    ```
    Then
    ```bash
    source ~/.zshrc
    or
    source ~/.bashrc
    or
    source ~/.bash_profile
    or
    . $PROFILE # for PowerShell
    ```

3. Note: The app replaces `${YARN_TOKEN}` in `.yarnrc.yml` with the `YARN_TOKEN` value at runtime.

## Internationalization

The application supports multiple languages for notifications, making it suitable for global teams and international deployments.

### Supported Languages

- English (en) - Default
- Vietnamese (vi)

### How It Works

Notifications are automatically sent in the language specified by the `LANG_CODE` environment variable. The system includes:

- Language-specific message templates for all notification types:
    - Website up notifications
    - Website down notifications
    - Host restarted notifications
    - Host manual intervention notifications
- Proper formatting of dates, times, and durations based on the configured language
- Fallback to English if translations for the specified language are not available

### Adding New Languages

To add support for a new language:

1. Create a new directory under `src/resources/localization/` with the language code (e.g., `es` for Spanish)
2. Add a `translations.json` file with translations for all notification messages
3. Follow the same structure as the existing language files, ensuring all keys are present
   Example structure for a new language:

```json
{
    "website_up": {
        "line1": "[Translated message for website up notification]",
        "line2": "[Translated message for downtime duration]"
    },
    "website_down": {
        "line1": "[Translated message for website down notification]",
        "line2": "[Translated message for downtime start]"
    },
    "host_restarted": {
        "line1": "[Translated message for host restart]",
        "line2": "[Translated message for timestamp]"
    },
    "host_manual_intervention": {
        "line1": "[Translated message for manual intervention]",
        "line2": "[Translated message for restart attempts]",
        "line3": "[Translated message for website status]"
    }
}
```

## Monitoring Flow

1. The system checks website availability at configured intervals (default: every minute)
2. If a website is down:
    - Website state is updated to "down"
    - Website down notification is sent
    - Host restart command is issued after exceeded `WEBSITE_DOWNTIME_THRESHOLD`
    - Host restarted notification is sent
3. The host restart process begins:
    - System verifies notification's delivery and specific object's state status such as Website, Host
    - Host restart is attempted via the appropriate cloud provider API or SDK or commands
    - System respects configured startup threshold and restart attempt limits
4. If the website comes back online:
    - Website up notification is sent
    - All states are reset to original states
5. If restart attempts exceed the configured limit:
    - Host manual intervention notification is sent
    - System continues monitoring the website
6. If a message sent:
    - Message is cleaned up
    - Queue is cleaned up

## Development

### Project Structure

```
src/
├── application/         # Application layer (use cases, handlers, processors, ...)
├── domain/              # Domain layer (entities, events, value objects, ...)
├── infrastructure/      # Infrastructure layer (repositories, clients, ...)
├── common/              # Shared utilities and constants
├── core/                # Core services (logging, configuration)
├── interfaces/          # API interfaces, controllers, middelwares, interceptors, guards, ...
├── scheduling/          # Scheduling system for periodic tasks
├── resources/           # Templates and localized messages
├── main.ts              # Application entry point
|
.github                  # Github Actions
|
infra/                   # Deployment templates and files
|
tests/                   # Unit-tests and e2e tests
```

### Testing

```bash
# Unit tests
npm run test
# or
yarn test
# E2E tests
npm run test:e2e
# or
yarn test:e2e
# Test coverage
npm run test:cov
# or
yarn test:cov
```

## API Endpoints

The application provides a RESTful API for monitoring and managing websites. API documentation is available via Swagger UI when the application is running.

### Available Endpoints

#### Health Check

```
GET /health
```

Returns the health status of the application.
**Response Example:**

```json
{
    "status": "ok",
    "info": {
        "application": {
            "status": "up"
        }
    }
}
```

### Authentication

API endpoints are protected using JWT authentication. To access protected endpoints, include a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### API Documentation

Detailed API documentation is available at `/v1/api/doc` when the application is running. The documentation is secured with basic authentication configured in the application settings.

### Deployment

#### Multinational Deployment

The application supports deployment across multiple countries, with initial configurations for:

- **Vietnam (vn)**: Deployed with Vietnamese (`vi`) notifications and timezone-specific settings (e.g., `Asia/Ho_Chi_Minh`).
- **United States (us)**: Deployed with English (`en`) notifications and timezone-specific settings (e.g., `America/New_York`).
  Each country deployment uses a dedicated Kubernetes namespace (e.g., `uptime-monitor-production-us`, `uptime-monitor-production-vn`) and Helm chart (e.g., `infra/us`, `infra/vn`) tailored to regional requirements.

#### Cross-Environment Deployment

The application operates across multiple environments, with initial configurations for:

- **Staging (stage)**: Used for testing new features and configurations in a near-production setup, deployed per country (e.g., `staging-vn`, `staging-us`).
- **Preprod (preprod)**: A pre-production environment for final validation before release, deployed per country (e.g., `preprod-vn`, `preprod-us`).
- **Production (production)**: The live environment, deployed per country (e.g., `production-vn`, `production-us`).
  Each environment uses distinct `.env.<env_type>` files (e.g., `.env.staging`, `.env.preprod`, `.env.production`) and Docker images tagged with the environment (e.g., `repo:sha-staging`, `repo:sha-production`).

#### CI/CD Pipeline

- **CI Workflow**: Runs unit tests and linting for all environments (staging, preprod, production) using GitHub Actions. Triggered on pull requests and tag pushes.
- **CD Workflow**: Deploys to staging (`master`), preprod (release/hotfix branches), and production (tags) with country-specific configurations. Supports manual deployment via `workflow_dispatch`.
- **CodeQL Analysis**: Performs advanced static code analysis for security vulnerabilities and code quality across all environments using GitHub’s CodeQL. Triggered on pushes to specified branches, pull requests, and a weekly schedule (every Monday at midnight UTC). Analyzes JavaScript and TypeScript codebases without requiring a build step.
  See `.github/workflows/ci.yml`, `.github/workflows/cd.yml`, `.github/workflows/build-helm-values.yml` and `.github/workflows/codeql.yml` for details.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgements

- Built with NestJS and Domain-Driven Design principles
- Supports multiple cloud providers for host management
- Implements comprehensive notification system
- Created by Atomatiz
