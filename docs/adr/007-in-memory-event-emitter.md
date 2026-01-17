# ADR-007: In-Memory Event Emitter for Domain Events

## Status
Accepted

## Context
The system uses domain events to decouple components and trigger side effects:
- `LeadAddedEvent` → Generate and send welcome messages
- `LeadRepliedEvent` → Generate and send follow-up messages
- `LeadMessagesSentEvent` → Track message delivery
- `MessageSentToLeadReplyEvent` → Track reply message delivery

Options for event handling:
1. **@nestjs/event-emitter** - In-process event emitter (EventEmitter2)
2. **Apache Kafka** - Distributed streaming platform with topics
3. **RabbitMQ** - Message broker with queues and exchanges
4. **AWS SNS/SQS** - Managed pub/sub and queue services
5. **Redis Pub/Sub** - Lightweight pub/sub via Redis

## Decision
We will use **@nestjs/event-emitter** (EventEmitter2) for domain events within the application.

```typescript
// Emitting events
this.eventEmitter.emit(LeadAddedEvent.eventName, event);

// Handling events
@OnEvent(LeadAddedEvent.eventName)
async handle(event: LeadAddedEvent): Promise<void> {
  const messages = await this.messagesGenerator.generateFor(event);
  // ... dispatch commands to queue
}
```

## Consequences

### Positive
- **Simplicity**: No external infrastructure required
- **Low latency**: Events processed in-process without network overhead
- **Easy testing**: Can verify event emission in integration tests
- **NestJS integration**: First-class support with decorators
- **Sufficient for MVP**: Demonstrates event-driven patterns effectively

### Negative
- **Not distributed**: Events only visible within single process
- **No persistence**: Events lost if handler fails (no replay capability)
- **No topics/partitions**: All handlers receive all events (no filtering)
- **No ordering guarantees**: Concurrent handlers may process out of order
- **Single point of failure**: Application crash loses in-flight events

## Production Considerations

For a production environment, consider:

1. **Transactional Outbox Pattern** - Write events to database table atomically with business data, then process asynchronously. See [RFC-001: Transactional Outbox Pattern](../rfc/001-transactional-outbox-pattern.md).

2. **Message Broker** (Kafka, RabbitMQ) - For distributed systems with multiple services needing event access, ordering guarantees, and replay capability.

3. **Hybrid Approach** - Keep in-memory emitter for local handlers, add outbox for critical events that must survive failures.

