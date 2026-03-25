---
name: Reviewer Workflow
description: Sequence execution for the Governance Validation Gate.
---

# Reviewer Workflow
> **Inheritance Notice**: This local flow operates within the golden path defined in [Global Workflows](../../workflows.md).

## Execution Steps
1. **Ingest Parameter**: Accept `DraftPost` package (including Text, Hashtags, and attached Diagram paths).
2. **Setup Prompt**: Compile the 5-point Policy Validation prompt against the draft.
3. **Execution**: Call `ChatGoogleGenerativeAI` to score and evaluate the post.
4. **Determine Verdict**:
   - If `PASS`: Return verdict with token signature.
   - If `REVISE`: Return verdict with detailed `Feedback` string.
   - If `BLOCK`: Log violation and return terminal verdict.
5. **Finalize**: Return payload back to the orchestrator to determine the next State switch.

## Retry Logic
- The Reviewer does not retry its own logic. It relies on the orchestrator to bounce `REVISE` verdicts back to the Content Generator up to `max_retries=3`.
