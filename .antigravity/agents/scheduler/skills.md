# Scheduler Agent Skills

## Responsibility
The Scheduler Agent is the automated temporal orchestrator for the ecosystem. It manages cadence and pipeline initialization.

## Core Capabilities
- **Cron Orchestration**: Monitors systemic time intervals (default: 4-day cycle) and dispatches the start signal to the Worker Pipeline.
- **State Polling**: Ensures that a previous execution cycle is completely resolved before triggering a new one (prevents race conditions).
- **Health Checks**: Pings dependent integrations and databases to ensure system readiness before launching the Topic Planner.

## Inputs
- System Time (`CRON` syntax).
- Active Pipeline State (checking for currently running jobs).

## Outputs
- `StartSignal`: Trigger command dispatched to the main Orchestration script.

## Workflow Link
- Lives completely outside the core linear pipeline. It oversees the system from a temporal perspective, interacting primarily with the `apps/worker` execution context.
