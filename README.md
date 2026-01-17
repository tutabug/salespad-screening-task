# SalesPad Tech Lead Screening Task

A lead management API with AI-powered messaging, demonstrating clean architecture principles.

## Tech Stack

- **Framework**: NestJS
- **Database**: Supabase (PostgreSQL)
- **Architecture**: Vertical Slice Architecture with Clean Architecture layers
- **Package Manager**: pnpm

## Project Structure

```
src/
  features/           # Vertical slices (leads, messaging, events)
    <feature>/
      domain/         # Entities and repository interfaces
      application/    # Use cases and DTOs
      infrastructure/ # Repository implementations
      presentation/   # Controllers
  shared/
    config/           # Environment validation
    infrastructure/   # Database configuration
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Supabase account (or local instance)

### Installation

```bash
pnpm install
```

### Environment Setup

Copy the example environment file and configure your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
NODE_ENV=development
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### Running the Application

```bash
# Development mode with hot reload
pnpm run start:dev

# Production mode
pnpm run start:prod

# Using Docker
docker-compose up
```

### API Documentation

Swagger UI is available at: http://localhost:3000/api

## Available Scripts

```bash
pnpm run start:dev    # Development with hot reload
pnpm run start:prod   # Production mode
pnpm run build        # Build the project
pnpm run lint         # Run ESLint
pnpm run format       # Format code with Prettier
pnpm run test         # Run unit tests
pnpm run test:e2e     # Run e2e tests
```

## API Endpoints

| Method | Endpoint      | Description                    |
|--------|---------------|--------------------------------|
| POST   | /lead         | Create a new lead              |
| GET    | /lead/:id     | Get lead with messages & jobs  |
| POST   | /send         | Queue outbound message         |
| POST   | /reply        | Simulate prospect reply        |
| POST   | /ai/reply     | Generate & queue AI response   |

## Architecture Highlights

- **Vertical Slice Architecture**: Each feature is self-contained
- **Clean Architecture Layers**: Domain → Application → Infrastructure → Presentation
- **Dependency Injection**: Abstract classes as injection tokens
- **Validation**: class-validator with global validation pipe
- **Documentation**: Swagger/OpenAPI auto-generated

## License

MIT
