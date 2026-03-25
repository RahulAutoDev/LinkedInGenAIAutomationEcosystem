---
name: Diagram Agent Workflow
description: Sequence execution for visual diagram enhancement.
---

# Diagram Agent Workflow
> **Inheritance Notice**: This local flow operates within the golden path defined in [Global Workflows](../../workflows.md).

## Execution Steps
1. **Sanity Check**: Evaluate if the `<diagram_mermaid>` field from the `DraftPost` is populated and valid strings.
   - If empty/null -> Skip and return immediately.
2. **Tool Execution**: Pass the string literal to the `Mermaid Diagram Renderer Tool`.
3. **CLI Operations**: Write temporary `.mmd` file -> Call `mmdc` -> Output `.png`.
4. **Verification**: Check if the resulting `.png` file exists on disk.
5. **Finalize**: Return the local image path string to the orchestrator.

## Retry Logic
- Tool retry bounds: `max_iter=5`. Fails gracefully without breaking the Content Pipeline if rendering is unrecoverable.
