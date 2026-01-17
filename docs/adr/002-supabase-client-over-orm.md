# ADR-002: Supabase Client over ORM

## Status
Accepted

## Context
We need to choose a database access strategy for interacting with Supabase (PostgreSQL). The options are:
1. **Supabase JS Client** (`@supabase/supabase-js`) - Direct REST API calls
2. **TypeORM** - Full-featured ORM with entity decorators
3. **Prisma** - Modern ORM with excellent TypeScript support
4. **Raw pg/node-postgres** - Direct PostgreSQL driver

SalesPad uses Supabase as their database platform, so the solution should align with their technology choices.

## Decision
We will use the **Supabase JS Client** (`@supabase/supabase-js`) directly for database operations.

Repository implementations will:
- Inject the Supabase client via NestJS DI
- Use Supabase's query builder for CRUD operations
- Map between database rows and domain entities manually

## Consequences

### Positive
- **Simplicity**: No ORM overhead, direct and transparent database calls
- **Alignment**: Matches SalesPad's technology stack
- **Flexibility**: Full access to Supabase features (realtime, auth, storage, edge functions)
- **Less abstraction**: Easier to debug and understand what queries are executed
- **Faster setup**: No schema synchronization or migration complexity for MVP

### Negative
- **Manual mapping**: Need to write toDomain/toDatabase mappers manually
- **No type safety for queries**: Query strings are not type-checked at compile time
- **No automatic migrations**: Database schema must be managed separately in Supabase

## Alternatives Considered

### TypeORM
**Rejected because**: 
- Adds significant complexity and boilerplate
- Entity decorators create coupling between domain and infrastructure
- Overkill for an MVP demonstrating clean architecture
- Not the idiomatic way to use Supabase

### Prisma
**Rejected because**:
- Excellent tool but adds another layer between app and Supabase
- Schema management duplicates what Supabase already provides
- Better suited when not using Supabase's additional features

### Raw pg/node-postgres
**Rejected because**:
- Loses Supabase-specific features (auth context, RLS, realtime)
- More manual work for connection pooling
- Doesn't leverage the Supabase platform
