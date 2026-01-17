# SalesPad Prototype: Backend Architecture

## Overview

This document describes the backend architecture for the SalesPad prototype. The system is designed to demonstrate core logic for lead capture, message queuing, and simulated replies using a scalable, event-driven approach with **NestJS**.

---

## System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  API CLIENT                                      │
│                    (e.g., Postman, curl, Frontend)                               │
│                                      │                                           │
└──────────────────────────────────────┼──────────────────────────────────────────┘
                                       │ REST API
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              NESTJS APPLICATION                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         PRESENTATION LAYER                                  │ │
│  │   ┌─────────────────┐                                                     │ │
│  │   │ LeadsController │ (Handles /leads endpoints)                          │ │
│  │   └────────┬────────┘                                                     │ │
│  └────────────┼─────────────────────────────────────────────────────────────┘ │
│               │                                                                │
│  ┌────────────▼─────────────────────────────────────────────────────────────┐ │
│  │                         APPLICATION LAYER                                  │ │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │ │
│  │   │ CreateLeadUseCase│  │ReplyToLeadUseCase│  │GetLeadDetailsQuery│         │ │
│  │   └────────┬────────┘  └────────┬────────┘  └─────────────────┘           │ │
│  │            │ emit               │ emit                                     │ │
│  │            ▼                    ▼                                          │ │
│  │   ┌──────────────────────────────────────┐                                │ │
│  │   │        IN-MEMORY EVENT EMITTER       │◄─── Domain Events              │ │
│  │   │  (LeadAddedEvent, LeadRepliedEvent)  │                                │ │
│  │   └────────────────┬─────────────────────┘                                │ │
│  │                    │ trigger                                               │ │
│  │                    ▼                                                       │ │
│  │   ┌─────────────────────────────────────┐                                 │ │
│  │   │         EVENT HANDLERS              │──┐                              │ │
│  │   │  (Generate and queue mock messages) │  │ enqueue commands            │ │
│  │   └─────────────────────────────────────┘  │                              │ │
│  └────────────────────────────────────────────┼─────────────────────────────┘ │
│                                               │                                │
│  ┌────────────────────────────────────────────▼─────────────────────────────┐ │
│  │                         INFRASTRUCTURE LAYER                              │ │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │ │
│  │   │ LeadRepository  │  │  BullMQ Queue   │  │ Mock AI & Senders │          │ │
│  │   │    (Prisma)     │  │    (Redis)      │  │ (In-memory fakes) │          │ │
│  │   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘          │ │
│  └────────────┼────────────────────┼────────────────────┼───────────────────┘ │
└───────────────┼────────────────────┼────────────────────┼───────────────────────┘
                │                    │                    │
                ▼                    ▼                    ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────────────┐
│    PostgreSQL     │  │      Redis        │  │     (Mocked) External APIs    │
│  (via Docker)     │  │   (via Docker)    │  │   (AI Content, Email/SMS)     │
└───────────────────┘  └───────────────────┘  └───────────────────────────────┘
```

---

## Core Backend Architecture

The prototype uses **Vertical Slice Architecture**. Each feature is a self-contained module with its own distinct layers, following Clean Architecture principles.

```
src/features/leads/
├── presentation/     # HTTP Controllers & Data Transfer Objects (DTOs)
├── application/      # Use Cases (write operations) & Queries (read operations)
├── domain/           # Business entities, repository interfaces, and events
└── infrastructure/   # Database logic (Prisma) & external service integrations
```

**Why this approach?**
- **High Cohesion**: All code for a single feature is located together.
- **Low Coupling**: Changes to one feature have minimal impact on others.
- **Testability**: Clear separation of concerns makes unit and integration testing straightforward.

---

## Database & Data Structures

We use **PostgreSQL** with **Prisma** as the ORM for type-safe database access. The schema focuses on the core entities required for the task.

```prisma
// prisma/schema.prisma

model Lead {
  id        String   @id
  name      String
  email     String?
  phone     String?
  status    String
  // ... timestamps
  messages  Message[]
  events    Event[]
}

model Message {
  id        String    @id
  lead      Lead      @relation(fields: [leadId], references: [id])
  leadId    String
  channel   String    // "email" or "whatsapp"
  direction String    // "inbound" or "outbound"
  content   Json
  // ... timestamps
}

model Event {
  id        String   @id
  lead      Lead     @relation(fields: [leadId], references: [id])
  leadId    String
  type      String   // e.g., "lead.added", "message.sent"
  payload   Json
  // ... timestamp
}
```

---

## Queue & Retry Logic

**BullMQ** (backed by **Redis**) manages background jobs, specifically for sending messages. This decouples the initial request from the actual message delivery.

**Flow:**
1.  An **event handler** (e.g., `OnLeadAdded`) decides a message should be sent.
2.  It adds a `send-message` job to the BullMQ queue.
3.  A separate **Queue Processor** (worker) picks up the job.
4.  The worker calls the appropriate (mock) channel sender.

**Retry Logic:**
- BullMQ is configured to automatically retry failed jobs.
- For this prototype, we demonstrate the capability with a simple configuration (e.g., 3 attempts with backoff). This prevents transient network errors from causing permanent failures.

---

## Implemented Logic & Flow

The prototype implements the following endpoints and logic flow:

**1. `POST /leads` - Capture a Lead**
   - `LeadsController` receives the request.
   - `CreateLeadUseCase` saves the lead to the database via the `LeadRepository`.
   - A `LeadAddedEvent` is emitted **in-memory**.
   - An event handler listens for this, generates mock welcome messages, and adds `send-message` jobs to the **BullMQ queue**.

**2. `POST /leads/:id/reply` - Simulate a Prospect Reply**
   - `LeadsController` receives the reply.
   - `ReplyToLeadUseCase` saves the inbound message.
   - A `LeadRepliedEvent` is emitted **in-memory**.
   - An event handler listens, generates a mock AI response, and queues it for sending via **BullMQ**.

**3. `GET /leads/:id` - View Lead Details**
   - `LeadsController` receives the request.
   - A `GetLeadDetailsQuery` class directly fetches all data for the lead, including messages and events, from the database.
   - The response groups messages by channel for clear presentation.

---

## Technology Stack

| Layer | Technology | Rationale for Prototype |
|---|---|---|
| **Framework** | **NestJS** | Provides a robust, modular structure out-of-the-box. |
| **Database** | **PostgreSQL + Prisma** | Ensures type-safety and simplifies database operations. |
| **Queue** | **BullMQ + Redis** | Demonstrates reliable, decoupled background job processing. |
| **Events** | **@nestjs/event-emitter** | Simple in-memory eventing to show event-driven flow. |
| **External APIs** | **Mocks/Fakes** | All external services (AI, Email) are mocked to focus on core logic. |
| **Deployment** | **Docker Compose** | Provides a consistent, one-command setup for the database and queue. |
