# ADR-003: Abstract Classes for Dependency Injection

## Status
Accepted

## Context
In Clean Architecture, the domain layer defines repository interfaces that infrastructure implements. NestJS uses dependency injection (DI) to wire implementations to consumers.

TypeScript interfaces exist only at compile time and are erased at runtime, which means they cannot be used directly as DI tokens in NestJS. Common solutions include:
1. Symbol-based injection tokens
2. String-based injection tokens
3. Abstract classes as injection tokens

## Decision
We will use **abstract classes** instead of interfaces for repository contracts that need to be injected.

```typescript
// domain/repositories/lead.repository.ts
export abstract class LeadRepository {
  abstract save(lead: Lead): Promise<Lead>;
  abstract findById(id: string): Promise<Lead | null>;
}

// In module
providers: [
  {
    provide: LeadRepository,
    useClass: SupabaseLeadRepository,
  },
]

// In use case
constructor(private readonly leadRepository: LeadRepository) {}
```

## Consequences

### Positive
- **Cleaner DI**: No need for Symbol tokens or `@Inject()` decorators
- **Type safety**: Abstract class provides both contract and type
- **IDE support**: Better autocomplete and refactoring support
- **Less boilerplate**: Simpler provider registration in modules
- **Self-documenting**: The abstract class clearly shows the contract

### Negative
- **Slight semantic mismatch**: Abstract classes imply implementation inheritance, but we use them as interfaces
- **Runtime overhead**: Minimal, but abstract classes exist at runtime unlike interfaces

## Alternatives Considered

### Symbol-based Injection Tokens
```typescript
export const LEAD_REPOSITORY = Symbol('LeadRepository');
export interface LeadRepository { ... }

// Usage requires @Inject decorator
constructor(@Inject(LEAD_REPOSITORY) private readonly repo: LeadRepository) {}
```
**Rejected because**: More boilerplate, requires maintaining separate Symbol constants, and the `@Inject()` decorator adds noise.

### String-based Injection Tokens
```typescript
providers: [{ provide: 'LeadRepository', useClass: ... }]
```
**Rejected because**: No type safety, prone to typos, harder to refactor.

### Interface + Symbol with Custom Decorator
**Rejected because**: Adds complexity with custom decorators for minimal benefit over abstract classes.
