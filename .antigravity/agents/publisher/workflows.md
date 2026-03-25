---
name: Publisher Workflow
description: Sequence execution for LinkedIn Delivery.
---

# Publisher Workflow
> **Inheritance Notice**: This local flow operates within the golden path defined in [Global Workflows](../../workflows.md).

## Execution Steps
1. **Verify Token**: Confirm Reviewer `PASS` condition is met.
2. **Media Prep**: If a `diagramPath` exists, invoke LinkedIn Media Asset Upload endpoints and store the returned `media_urn`.
3. **Build Body**: Compile Text body + hashtags.
4. **Execution**: Post payload to LinkedIn UGC POST endpoint.
5. **Audit**: Extract resulting LinkedIn Post URL and URNS. Route data to the `AuditLog`.
6. **State Switch**: Signal orchestrator that cycle is strictly `PUBLISHED`.

## Retry Logic
- Task-level retries handle `502/503/504` infrastructure errors up to 3 times.
