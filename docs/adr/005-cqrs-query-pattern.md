# ADR-005: CQRS Query Pattern for Read Operations

## Status
Accepted

## Context
Following Clean Architecture, use cases orchestrate business logic. However, for read-only operations (queries), use cases often become thin wrappers that simply call repositories and map data.

The CQRS (Command Query Responsibility Segregation) pattern suggests separating:
- **Commands**: Operations that change state (create, update, delete)
- **Queries**: Operations that only read data

For commands, use cases provide value by orchestrating domain events, transactions, and side effects. For queries, this orchestration is often unnecessary.

## Decision
We will use **dedicated Query classes** for read operations instead of use cases.

Query classes:
- Are injected directly into controllers (no intermediate use case layer)
- Have an abstract class defining the contract
- Have infrastructure implementations (e.g., Prisma)
- Can optimize reads with JOINs and projections without domain entity constraints

```typescript
// Abstract query contract
export abstract class GetLeadDetailsQuery {
  abstract execute(input: GetLeadDetailsQueryInput): Promise<LeadDetailsResponseDto>;
}

// Prisma implementation - can use optimized queries
@Injectable()
export class PrismaGetLeadDetailsQuery extends GetLeadDetailsQuery {
  async execute(input: GetLeadDetailsQueryInput): Promise<LeadDetailsResponseDto> {
    const leadRecord = await this.prisma.lead.findUnique({
      where: { uuid: input.leadId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
    // Map directly to DTO, no domain entity intermediary
    return { lead: {...}, messagesByChannel: {...}, events: [...] };
  }
}

// Controller uses query directly
@Get(':id')
async getDetails(@Param('id') leadId: string): Promise<LeadDetailsResponseDto> {
  return this.getLeadDetailsQuery.execute({ leadId });
}
```

## Consequences

### Positive
- **Simpler read path**: No unnecessary use case layer for queries
- **Performance**: Queries can be optimized without domain model constraints
- **Clear intent**: Separation makes it obvious which operations modify state
- **Flexible projections**: Can return DTOs shaped for specific UI needs
- **Testability**: Query implementations can be swapped via DI

### Negative
- **Two patterns**: Commands use use cases, queries use query classes
- **Potential inconsistency**: Need discipline to apply pattern correctly
- **Learning curve**: Team needs to understand CQRS concepts

## When to Use

**Use Query classes for**:
- GET endpoints that only read data
- Complex read operations with JOINs
- Operations returning data shaped for specific views

**Use Use Cases for**:
- POST/PUT/DELETE operations that modify state
- Operations that emit domain events
- Operations requiring transactions across aggregates
