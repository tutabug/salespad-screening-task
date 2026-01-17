# ADR-002: Prisma ORM for Database Access

## Status
Accepted

## Context
We need to choose a database access strategy for interacting with PostgreSQL. The options are:
1. **Prisma** - Modern ORM with excellent TypeScript support and type-safe queries
2. **TypeORM** - Full-featured ORM with entity decorators
3. **Raw pg/node-postgres** - Direct PostgreSQL driver
4. **Supabase JS Client** - Direct REST API calls

The system requires:
- Type-safe database operations
- Transaction support for maintaining consistency
- Easy schema management and migrations
- Good developer experience with TypeScript

## Decision
We will use **Prisma** as our ORM for database access.

Repository implementations will:
- Inject PrismaService via NestJS DI (using `nestjs-prisma`)
- Use Prisma's type-safe query builder for CRUD operations
- Leverage Prisma transactions (`$transaction`) for atomic operations
- Map between Prisma models and domain entities

```typescript
// Infrastructure repository implementation
@Injectable()
export class PrismaLeadRepository extends LeadRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async addLead(input: AddLeadInput): Promise<{ lead: Lead; event: LeadAddedEvent }> {
    const [createdLead, createdEvent] = await this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({ data: { ... } });
      const event = await tx.leadEvent.create({ data: { ... } });
      return [lead, event];
    });
    return { lead: this.toDomain(createdLead), event };
  }
}
```

## Consequences

### Positive
- **Type safety**: Prisma Client is fully typed based on schema, catching errors at compile time
- **Transactions**: Native `$transaction` API for atomic multi-table operations
- **Developer experience**: Excellent autocomplete, generated types, and Prisma Studio
- **Migrations**: Built-in migration system with `prisma migrate`
- **Performance**: Efficient query batching and connection pooling

### Negative
- **Additional dependency**: Requires Prisma CLI and generated client
- **Schema duplication**: Database schema defined in `schema.prisma` separate from domain entities
- **Learning curve**: Prisma-specific query syntax

## Alternatives Considered

### TypeORM
**Rejected because**: 
- Entity decorators create coupling between domain and infrastructure
- Less type-safe than Prisma
- More complex configuration

### Raw SQL with pg
**Rejected because**:
- No type safety for queries
- Manual connection management
- More boilerplate for common operations

### Supabase JS Client
**Rejected because**:
- Not using Supabase platform features
- Less type safety than Prisma
- REST-based adds latency compared to direct database connection
