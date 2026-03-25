---
name: Persistence Workflow
description: Formal state transition sequence for relational and semantic data.
---

# Persistence Workflow

## Execution Steps
1. **Topic Phase**:
   - Agent selects topic.
   - Core orchestrator explicitly calls `packages/integrations/vector` to query embeddings.
   - If novel, orchestrator INSERTs exact Topic into DB, immediately generating new ID.
2. **Draft Phase**:
   - Content Generator outputs post.
   - Orchestrator INSERTs into Posts table (`version=1`, `status=DRAFT`).
3. **Review & Version Tracking**:
   - If Reviewer -> `REVISE`: Orchestrator updates active Draft, bumps `version++`, and INSERTs Feedback failure into `Feedback` table.
   - If Reviewer -> `PASS`: Orchestrator updates status to `REVIEW_PASSED`.
4. **Approval & Publish**:
   - Human signals `APPROVED`.
   - Publish executes -> Updates status `PUBLISHED`.
5. **Continuous Telemetry**:
   - ALL steps emit `(step, status, message)` triggers to the `Logs` table synchronously.
