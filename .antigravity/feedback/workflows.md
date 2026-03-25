---
name: Feedback Loop Workflow
description: Sequence execution for capturing and applying system telemetry.
---

# Feedback Loop Workflow

## Execution Steps
1. **Trigger Phase**:
   - Event A: Reviewer issues `REVISE` or `BLOCK` on a draft.
   - Event B: Human overrides an approval.
   - Event C: Analytics Cron fires (8-12 hours post-publish).
2. **Capture & Scoring Translation**:
   - Extract the core failure reason or metric delta.
   - Run the **Feedback Scoring Engine**: Assign a 1-10 mathematical score resolving into a `GOOD` vs `BAD` classification.
3. **Storage & Memory Integration**:
   - Write structured reason + `Quality Score` to PostgreSQL `feedback_log`.
   - Embed text rationale into Vector DB (labeled distinctly as `success_pattern` or `rejection_pattern`).
4. **Adaptive Synthesis & Routing**:
   - **Topic Reshuffling**: Auto-adjust the Topic Planner queue (synthetically boost semantic neighbors of `GOOD` posts, drop neighbors of `BAD`).
   - **Negative Prompting**: Inject recurrent `rejection_patterns` into the Reviewer and Content Generator's negative constraints list.

## Asynchronous Application
- Feedback is applied on **Process T+1**. The active pipeline does not halt to train models; it queues the feedback for the next orchestration cycle.
