---
name: Scheduler Workflow
description: Sequence execution for Temporal Cadences.
---

# Scheduler Workflow
> **Inheritance Notice**: This local flow operates within the golden path defined in [Global Workflows](../../workflows.md).

## Execution Steps
1. **Init**: Load Cron Configuration parameters.
2. **Listen**: Append asynchronous task listener to background thread.
3. **Trigger Event**: Upon chronological match, log the initial trigger.
4. **Execution Wrapper**: Import and execute the central `LinkedIn_Orchestrator` main entry point.
5. **Conclusion**: Print final `Pipeline State` JSON block outputs and cleanly reset listener.

## Retry Logic
- Node/Cron does not implicitly retry if the wrapped application logic fatals. Failsafes exist strictly inside the downstream Orchestrator.
