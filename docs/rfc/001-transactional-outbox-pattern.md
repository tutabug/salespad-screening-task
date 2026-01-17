# RFC-001: Transactional Outbox Pattern for Reliable Event/Command Delivery

## Status
Proposed

## Summary
Implement the Transactional Outbox Pattern to guarantee reliable delivery of domain events and commands, ensuring no messages are lost even during system failures or message broker outages.

## Motivation

### Current State
The system currently uses:
- **In-memory EventEmitter** (`@nestjs/event-emitter`) for domain events
- **BullMQ** for command processing

### Problems with Current Approach

1. **Race Condition Risk**: Database transaction commits, but event emission fails
```typescript
// Current: Two separate operations, not atomic
await this.prisma.$transaction(async (tx) => {
  await tx.lead.create({ ... });
  await tx.leadEvent.create({ ... });
});
// If this fails, database is updated but no event emitted
this.eventEmitter.emit(LeadAddedEvent.eventName, event);
```

2. **Lost Events**: Application crash between DB commit and event emission loses events permanently

3. **No Replay Capability**: Cannot recover or replay failed events

4. **Broker Downtime**: If Redis/message broker is unavailable, commands are lost

## Detailed Design

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Single Transaction                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Update Lead  │ +  │ Insert Event │ +  │Insert Command│       │
│  │    Table     │    │  to Outbox   │    │  to Outbox   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Outbox Processor Service                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Poll outbox tables for unpublished entries              │   │
│  │  Publish to Kafka/RabbitMQ/EventEmitter                  │   │
│  │  Mark as published (or delete after retention period)    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Event Outbox Table
CREATE TABLE event_outbox (
  id SERIAL PRIMARY KEY,
  aggregate_type VARCHAR(255) NOT NULL,      -- 'Lead', 'Message'
  aggregate_id UUID NOT NULL,                 -- Entity ID
  event_type VARCHAR(255) NOT NULL,           -- 'LeadAddedEvent'
  payload JSONB NOT NULL,                     -- Event data
  correlation_ids JSONB,                      -- Tracing context
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP NULL,                -- NULL = pending
  retry_count INT DEFAULT 0,
  last_error TEXT NULL
);

CREATE INDEX idx_event_outbox_unpublished 
  ON event_outbox (created_at) 
  WHERE published_at IS NULL;

-- Command Outbox Table  
CREATE TABLE command_outbox (
  id SERIAL PRIMARY KEY,
  command_type VARCHAR(255) NOT NULL,         -- 'SendMessageCommand'
  payload JSONB NOT NULL,                     -- Command data
  correlation_ids JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP NULL,
  retry_count INT DEFAULT 0,
  last_error TEXT NULL
);

CREATE INDEX idx_command_outbox_unpublished 
  ON command_outbox (created_at) 
  WHERE published_at IS NULL;
```

### Prisma Schema Addition

```prisma
model EventOutbox {
  id             Int       @id @default(autoincrement())
  aggregateType  String    @map("aggregate_type")
  aggregateId    String    @map("aggregate_id") @db.Uuid
  eventType      String    @map("event_type")
  payload        Json
  correlationIds Json?     @map("correlation_ids")
  createdAt      DateTime  @default(now()) @map("created_at")
  publishedAt    DateTime? @map("published_at")
  retryCount     Int       @default(0) @map("retry_count")
  lastError      String?   @map("last_error")

  @@index([createdAt], map: "idx_event_outbox_unpublished")
  @@map("event_outbox")
}

model CommandOutbox {
  id             Int       @id @default(autoincrement())
  commandType    String    @map("command_type")
  payload        Json
  correlationIds Json?     @map("correlation_ids")
  createdAt      DateTime  @default(now()) @map("created_at")
  publishedAt    DateTime? @map("published_at")
  retryCount     Int       @default(0) @map("retry_count")
  lastError      String?   @map("last_error")

  @@index([createdAt], map: "idx_command_outbox_unpublished")
  @@map("command_outbox")
}
```

### Repository Changes

```typescript
// Before: Event emitted outside transaction
async addLead(input: AddLeadInput): Promise<{ lead: Lead; event: LeadAddedEvent }> {
  const result = await this.prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({ ... });
    const event = await tx.leadEvent.create({ ... });
    return { lead, event };
  });
  
  // Risk: This could fail after transaction commits
  this.eventEmitter.emit(LeadAddedEvent.eventName, result.event);
  return result;
}

// After: Outbox entry in same transaction
async addLead(input: AddLeadInput): Promise<{ lead: Lead; event: LeadAddedEvent }> {
  return this.prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({ ... });
    const event = await tx.leadEvent.create({ ... });
    
    // Atomic: Either both succeed or both fail
    await tx.eventOutbox.create({
      data: {
        aggregateType: 'Lead',
        aggregateId: lead.uuid,
        eventType: LeadAddedEvent.eventName,
        payload: event.payload as object,
        correlationIds: event.correlationIds as object,
      },
    });
    
    return { lead, event };
  });
}
```

### Outbox Processor Service

```typescript
@Injectable()
export class OutboxProcessorService {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private readonly MAX_RETRIES = 5;
  private readonly BATCH_SIZE = 100;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly commandBus: CommandBus,
  ) {}

  @Cron('*/5 * * * * *') // Every 5 seconds
  async processEventOutbox(): Promise<void> {
    const entries = await this.prisma.eventOutbox.findMany({
      where: { 
        publishedAt: null,
        retryCount: { lt: this.MAX_RETRIES },
      },
      orderBy: { createdAt: 'asc' },
      take: this.BATCH_SIZE,
    });

    for (const entry of entries) {
      try {
        // Emit event (or publish to Kafka in production)
        this.eventEmitter.emit(entry.eventType, entry.payload);
        
        await this.prisma.eventOutbox.update({
          where: { id: entry.id },
          data: { publishedAt: new Date() },
        });
        
        this.logger.log(`Published event ${entry.eventType} for ${entry.aggregateId}`);
      } catch (error) {
        await this.prisma.eventOutbox.update({
          where: { id: entry.id },
          data: { 
            retryCount: { increment: 1 },
            lastError: error.message,
          },
        });
        this.logger.error(`Failed to publish event ${entry.id}: ${error.message}`);
      }
    }
  }

  @Cron('*/5 * * * * *')
  async processCommandOutbox(): Promise<void> {
    const entries = await this.prisma.commandOutbox.findMany({
      where: { 
        publishedAt: null,
        retryCount: { lt: this.MAX_RETRIES },
      },
      orderBy: { createdAt: 'asc' },
      take: this.BATCH_SIZE,
    });

    for (const entry of entries) {
      try {
        await this.commandBus.dispatch(entry.payload as Command);
        
        await this.prisma.commandOutbox.update({
          where: { id: entry.id },
          data: { publishedAt: new Date() },
        });
      } catch (error) {
        await this.prisma.commandOutbox.update({
          where: { id: entry.id },
          data: { 
            retryCount: { increment: 1 },
            lastError: error.message,
          },
        });
      }
    }
  }

  // Cleanup old processed entries (run daily)
  @Cron('0 0 * * *')
  async cleanupProcessedEntries(): Promise<void> {
    const retentionDays = 7;
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    await this.prisma.eventOutbox.deleteMany({
      where: { 
        publishedAt: { not: null, lt: cutoff },
      },
    });
    
    await this.prisma.commandOutbox.deleteMany({
      where: { 
        publishedAt: { not: null, lt: cutoff },
      },
    });
  }
}
```

### Alternative: Change Data Capture (CDC)

Instead of polling, use Debezium to capture database changes:

```
PostgreSQL WAL → Debezium Connector → Kafka → Consumers
```

**Pros:**
- Real-time (no polling delay)
- Lower database load
- Captures all changes automatically

**Cons:**
- More infrastructure (Kafka Connect, Debezium)
- More complex setup and monitoring
- Requires Kafka

## Drawbacks

1. **Increased Complexity**: Additional tables, processor service, and operational concerns
2. **Latency**: Polling interval adds delay (mitigated by short intervals or CDC)
3. **Database Load**: Polling queries every N seconds
4. **Duplicate Handling**: Consumers must be idempotent (events may be delivered more than once)
5. **Operational Overhead**: Need to monitor outbox tables, handle stuck entries

## Alternatives

### 1. Synchronous Event Emission (Current)
- **Pros**: Simple, low latency
- **Cons**: Not reliable, events can be lost

### 2. Two-Phase Commit
- **Pros**: True atomicity across systems
- **Cons**: Complex, poor performance, not supported by all systems

### 3. Saga Pattern
- **Pros**: Handles distributed transactions
- **Cons**: Overkill for event emission, complex compensation logic

## Unresolved Questions

1. **Polling Interval**: What's the optimal balance between latency and database load?
2. **Retention Policy**: How long to keep processed outbox entries?
3. **Dead Letter Handling**: What to do with entries that exceed max retries?
4. **Monitoring**: What metrics and alerts are needed?
5. **CDC vs Polling**: Is the complexity of Debezium worth the benefits?

## Implementation Plan

If accepted:

1. **Phase 1**: Add outbox tables and Prisma models
2. **Phase 2**: Update repositories to write to outbox
3. **Phase 3**: Implement OutboxProcessorService
4. **Phase 4**: Add monitoring and alerting
5. **Phase 5**: (Optional) Migrate to CDC with Debezium

## References

- [Microservices Pattern: Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html)
- [Debezium - Change Data Capture](https://debezium.io/)
- [Reliable Microservices Data Exchange With the Outbox Pattern](https://debezium.io/blog/2019/02/19/reliable-microservices-data-exchange-with-the-outbox-pattern/)
