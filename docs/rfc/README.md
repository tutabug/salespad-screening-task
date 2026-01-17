# Request for Comments (RFC)

This directory contains RFCs for proposed architectural changes and improvements that are under consideration but not yet accepted.

## What is an RFC?

An RFC is a document that proposes a significant change to the system architecture. Unlike ADRs which document accepted decisions, RFCs are discussion documents that may or may not be implemented.

## RFC Status Lifecycle

1. **Draft** - Initial proposal being written
2. **Proposed** - Ready for team review and discussion
3. **Accepted** - Approved for implementation (becomes an ADR)
4. **Rejected** - Not approved, with documented reasoning
5. **Deferred** - Valid proposal but postponed for later consideration

## RFC Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| [RFC-001](001-transactional-outbox-pattern.md) | Transactional Outbox Pattern for Reliable Event/Command Delivery | Proposed | 2026-01-17 |

## RFC Template

When creating a new RFC, use the following template:

```markdown
# RFC-XXX: Title

## Status
Draft | Proposed | Accepted | Rejected | Deferred

## Summary
One paragraph explanation of the proposal.

## Motivation
Why are we doing this? What problem does it solve?

## Detailed Design
Technical details of the proposed solution.

## Drawbacks
Why should we *not* do this?

## Alternatives
What other designs have been considered?

## Unresolved Questions
What parts of the design are still TBD?
```
