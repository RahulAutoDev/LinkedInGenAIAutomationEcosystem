---
name: Content Generator Workflow
description: Sequence execution for Content Drafting.
---

# Content Generator Workflow
> **Inheritance Notice**: This local flow operates within the golden path defined in [Global Workflows](../../workflows.md).

## Execution Steps
1. **Ingest Parameter**: Accept `TopicBrief` (and optional `RevisionFeedback`).
2. **Setup Prompt**: Compile the user instruction utilizing the prompt template and the injected brief parameters.
3. **Execution**: Call `ChatGoogleGenerativeAI` to draft the post.
4. **Parse & Validate**:
   - Strip codeblock backticks if present.
   - Run Pydantic/Zod parsing to ensure the JSON object conforms to schema.
5. **Finalize**: Return the parsed output back to the orchestrator.

## Retry Logic
- **JSON Parsing Task**: Retries automatically up to `max_retries=3` if the output does not conform to the schema template.
