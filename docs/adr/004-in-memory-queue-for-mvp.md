# ADR-004: In-Memory Queue for MVP

## Status
Accepted

## Context
The system requires queue functionality for:
- Enqueueing outbound messages (email, WhatsApp, etc.)
- Retry logic for failed deliveries
- Job status tracking

Options for queue implementation:
1. **In-memory queue** - Simple array/map-based queue in the application
2. **BullMQ with Redis** - Production-grade job queue
3. **Supabase Edge Functions + pg_cron** - Serverless approach
4. **AWS SQS / Google Cloud Tasks** - Managed cloud queues

## Decision
We will implement a **simple in-memory queue** for the MVP/screening task.

The queue will:
- Store jobs in a Map with job ID as key
- Support basic retry logic with configurable max attempts
- Track job status (pending, processing, completed, failed)
- Log state transitions as events

```typescript
interface Job {
  id: string;
  type: JobType;
  payload: any;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}
```

## Consequences

### Positive
- **Simplicity**: No external dependencies (Redis), easy to understand and debug
- **Fast development**: Can implement and test quickly within the 48-hour deadline
- **Demonstrates concepts**: Shows understanding of queue patterns without infrastructure complexity
- **Self-contained**: The entire solution runs without additional services

### Negative
- **Not production-ready**: Jobs are lost on application restart
- **No distributed processing**: Cannot scale horizontally
- **No persistence**: Queue state only exists in memory
- **Limited features**: No delayed jobs, priorities, or advanced retry strategies

## Alternatives Considered

### BullMQ with Redis
**Rejected because**:
- Requires Redis infrastructure (Docker container or managed service)
- Adds complexity for a screening task
- Overkill for demonstrating queue concepts

**Would be the choice for production** - clearly document this in architecture doc.

### Supabase Edge Functions + pg_cron
**Rejected because**:
- Moves logic outside the NestJS application
- Harder to demonstrate in a self-contained repo
- Less familiar pattern for most developers

### Database-backed Queue (using Supabase)
**Considered as alternative**: Store jobs in a `jobs` table, poll for pending jobs.
**Could be added later** if we need persistence without Redis complexity.

## Future Evolution
For production, this would be replaced with BullMQ + Redis:
- Add `@nestjs/bullmq` package
- Create job processors for each message type
- Add Redis to docker-compose
- Implement proper retry strategies with exponential backoff
