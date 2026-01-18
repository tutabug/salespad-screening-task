# SalesPad Screening Task

A lead management API with event-driven messaging, demonstrating clean architecture principles.

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL + Prisma ORM
- **Queue**: BullMQ + Redis
- **Architecture**: Vertical Slice + Clean Architecture

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- Docker & Docker Compose

### Setup

```bash
# Install dependencies
pnpm install

# Start PostgreSQL & Redis
docker-compose up -d

# Run migrations
pnpm prisma migrate dev

# Start the server
pnpm start:dev
```

### API Documentation

Swagger UI available at: http://localhost:3000/api

## API Endpoints

| Method | Endpoint            | Description                          |
|--------|---------------------|--------------------------------------|
| POST   | /leads              | Create a lead (triggers welcome msg) |
| POST   | /leads/:id/reply    | Simulate prospect reply (triggers AI response) |
| GET    | /leads/:id          | Get lead + messages + events         |

## Project Structure

```
src/features/leads/
├── presentation/     # Controllers & DTOs
├── application/      # Use Cases (commands) & Queries (reads)
├── domain/           # Entities, events, repository interfaces
└── infrastructure/   # Prisma repositories, queue processors
```

## Documentation

- **[Architecture Decision Records](docs/adr/)** – Key technical decisions (Prisma, BullMQ, CQRS, etc.)
- **[RFCs](docs/rfc/)** – Proposed improvements (Transactional Outbox Pattern)

## Scripts

```bash
pnpm start:dev        # Development with hot reload
pnpm build            # Build for production
pnpm test:integration # Run integration tests
pnpm lint             # Run ESLint
```

## License

MIT
