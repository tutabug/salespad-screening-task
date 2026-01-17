# ADR-001: Vertical Slice Architecture

## Status
Accepted

## Context
We need to choose an architecture pattern for a NestJS API that demonstrates clean code principles, maintainability, and scalability. The system will handle leads, messaging, and event logging with potential for future channel extensions (Email, WhatsApp, LinkedIn, Voice, Ads).

Traditional layered architecture (controllers → services → repositories) tends to create tight coupling between layers and makes it difficult to understand a single feature's complete flow.

## Decision
We will use **Vertical Slice Architecture** combined with **Clean Architecture** principles within each slice.

Structure:
```
src/
  features/
    <feature-name>/
      domain/           # Pure business entities and repository interfaces
      application/      # Use cases and DTOs
      infrastructure/   # Repository implementations
      presentation/     # HTTP controllers
      <feature>.module.ts
  shared/
    infrastructure/     # Cross-cutting concerns (database, etc.)
```

Each feature is a self-contained vertical slice with its own Clean Architecture layers.

## Consequences

### Positive
- **Feature isolation**: Each feature can be developed, tested, and deployed independently
- **Clear boundaries**: Easy to understand what code belongs to which feature
- **Scalability**: New features don't affect existing ones
- **Team scaling**: Different team members can work on different features without conflicts
- **Onboarding**: New developers can understand one feature without knowing the entire system

### Negative
- **Initial overhead**: More directories and files to set up per feature
- **Potential duplication**: Some similar code patterns across features
- **Learning curve**: Developers unfamiliar with the pattern need time to adapt

## Alternatives Considered

### Traditional Layered Architecture
```
src/
  controllers/
  services/
  repositories/
  entities/
```
**Rejected because**: Changes to a feature require touching multiple directories, harder to trace feature logic, tends toward tight coupling.

### Hexagonal Architecture (Ports & Adapters)
**Rejected because**: More complex for an MVP/screening task, better suited for larger systems with multiple external integrations.

### Simple Service-based Architecture
**Rejected because**: Doesn't demonstrate Clean Architecture principles, harder to maintain as the system grows.
