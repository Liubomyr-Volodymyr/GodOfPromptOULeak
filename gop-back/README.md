# Custom Prompt

A NestJS-based application for prompt management and generation with PostgreSQL database integration and Redis for job queue processing.

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- PostgreSQL
- Redis

## Tech Stack

- NestJS
- PostgreSQL with Sequelize ORM
- Redis with Bull for queue management
- Google Cloud Storage
- Notion API integration
- OpenAI integration
- Puppeteer for web scraping
- Handlebars for email templating

## Getting Started

1. Clone the repository
2. Create `.env` file based on `.env.example` and fill in the required environment variables
3. Install dependencies: `npm install`
4. Build Docker containers: `npm run local:docker:build`
5. Run development environment: `npm run local`

## Local Development Commands

```bash
# Start development environment
npm run local

# Database migrations
npm run local:db:migrate          # Run migrations
npm run local:add:migration name  # Generate new migration
npm run local:undo:migration      # Revert last migration

# Docker commands
npm run local:docker:down         # Stop containers
npm run local:docker:build        # Rebuild containers

# Code quality
npm run prettier                  # Format code
npm run lint                      # Run ESLint
```

## Project Structure

- `src/` - Source code
    - `generator/` - Main module
    - `mail/templates/` - Email templates
    - `pdf/fonts/` - Fonts for PDF files
    - `common/` - Shared utilities and configurations

## API Endpoints

The API is available at `/api` endpoint with CORS enabled. For detailed API documentation, contact the project maintainers.

## License

This project is proprietary and unlicensed.
