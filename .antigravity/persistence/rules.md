---
name: Persistence Rules
description: Data durability, logging, and state history obligations.
---

# Persistence Rules

## 1. Storage Constraints
- **Absolute Retention**: Every generated `DraftPost` and every published Payload must be stored. No ephemeral drops.
- **Mandatory Embedding**: Prior to saving, all newly selected Topics MUST be passed through the Vector DB Embedding routine to trace semantic history.

## 2. Versioning & Lineage
- **Draft Iterations**: If the Reviewer issues a `REVISE`, the incoming newly drafted text must be stored as `v2`, `v3`, etc. Original drafts MUST NOT be destructively overwritten.
- **Status Truth**: The `Posts.status` column serves as the absolute source of truth for pipeline states (e.g. `DRAFT`, `REVIEW`, `APPROVED`, `PUBLISHED`).

## 3. Auditing Obligations
- **Tracing**: All actions (verdicts, triggers, network failures) MUST be strictly lodged in the `Logs` table.
- **Feedback Loop**: Quality scores and Rejection feedback must be retained alongside the underlying `Post` ID.
