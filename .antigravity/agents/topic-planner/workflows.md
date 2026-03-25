---
name: Topic Planner Workflow
description: Sequence execution for Topic Planning.
---

# Topic Planner Workflow
> **Inheritance Notice**: This local flow operates within the golden path defined in [Global Workflows](../../workflows.md).

## Execution Steps
1. **Initialize**: Pull topic backlog from data store.
2. **Prioritize**: Sort candidates by urgency / engagement score.
3. **Deduplicate**: Execute the `Vector DB Dedupe Tool` on the top candidate.
4. **Validation Branches**:
   - If `True` (duplicate) -> Drop candidate, pull the next one.
   - If `False` -> Proceed to drafting.
5. **Generation**: Instruct the LLM to write the `TopicBrief`.
6. **Pass-through**: Return the `TopicBrief` to the orchestrator.

## Retry Logic
- Tool execution retry limit: `max_iter = 5`.
- Deduplication retry: Automatically iterates until a novel topic is found or the pool empties.
