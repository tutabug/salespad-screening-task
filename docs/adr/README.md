# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the SalesPad Lead Management API.

## What is an ADR?

An ADR is a document that captures an important architectural decision made along with its context and consequences.

## ADR Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| [ADR-001](001-vertical-slice-architecture.md) | Vertical Slice Architecture | Accepted | 2026-01-17 |
| [ADR-002](002-prisma-orm-for-database.md) | Prisma ORM for Database Access | Accepted | 2026-01-17 |
| [ADR-003](003-abstract-classes-for-di.md) | Abstract Classes for Dependency Injection | Accepted | 2026-01-17 |
| [ADR-004](004-bullmq-redis-for-commands.md) | BullMQ with Redis for Command Processing | Accepted | 2026-01-17 |
| [ADR-005](005-cqrs-query-pattern.md) | CQRS Query Pattern for Read Operations | Accepted | 2026-01-17 |
| [ADR-006](006-nestjs-framework.md) | NestJS as Application Framework | Accepted | 2026-01-17 |
| [ADR-007](007-in-memory-event-emitter.md) | In-Memory Event Emitter for Domain Events | Accepted | 2026-01-17 |

## ADR Template

When creating a new ADR, use the following template:

```markdown
# ADR-XXX: Title

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult to do because of this change?

## Alternatives Considered
What other options were considered and why were they rejected?
```
