# ADR-004: BullMQ with Redis for Command Processing

## Status
Accepted

## Context
The system requires queue functionality for:
- Enqueueing outbound messages (email, WhatsApp, etc.)
- Async command processing (CQRS pattern)
- Retry logic for failed deliveries
- Job status tracking

Options for queue implementation:
1. **BullMQ with Redis** - Production-grade job queue with NestJS integration
2. **In-memory queue** - Simple array/map-based queue in the application
3. **AWS SQS / Google Cloud Tasks** - Managed cloud queues

## Decision
We will use **BullMQ with Redis** for command processing via the `@nestjs/bullmq` package.

The implementation:
- Uses a dedicated command queue for async operations
- Processes SendMessageCommand via a dedicated processor
- Integrates with NestJS dependency injection
- Supports retry logic and job status tracking

```typescript
// Command dispatch via event handler
@OnEvent(LeadAddedEvent.eventName)
async handle(event: LeadAddedEvent): Promise<void> {
  const messages = await this.messagesGenerator.generateFor(event);
  await this.messageRepository.saveMessagesSent({ ... });
  
  for (const message of messages) {
    await this.commandBus.dispatch(
      new SendMessageCommand(message.id, message.channel, message.channelMessage)
    );
  }
}

// Processor handles the command
@Processor(COMMAND_QUEUE_NAME)
export class SendMessageCommandProcessor extends WorkerHost {
  async process(job: Job<SendMessageCommand>): Promise<void> {
    const sender = this.senderRegistry.getSenderForChannel(job.data.payload.channel);
    await sender.send(job.data.payload.channelMessage);
  }
}
```

## Consequences

### Positive
- **Production-ready**: Persistent jobs survive application restarts
- **Retry logic**: Built-in exponential backoff and configurable retry policies
- **Observability**: Job status, progress tracking, and failed job inspection
- **Scalability**: Multiple workers can process jobs concurrently
- **NestJS integration**: First-class support via `@nestjs/bullmq`

### Negative
- **Infrastructure dependency**: Requires Redis instance
- **Complexity**: More setup than in-memory solution
- **Local development**: Need to run Redis (mitigated by Docker Compose)

## Alternatives Considered

### In-Memory Queue
**Rejected because**:
- Jobs are lost on application restart
- Cannot scale horizontally
- No persistence or advanced retry strategies

### AWS SQS / Google Cloud Tasks
**Rejected because**:
- Adds cloud provider lock-in
- More complex setup for local development
- Overkill when Redis provides sufficient capabilities
