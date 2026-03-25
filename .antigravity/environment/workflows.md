---
name: Environment Workflow
description: Injection and validation flow for environment variables.
---

# Environment Validation Workflow

## Execution Steps
1. **Bootstrap**: Application reads `.env` on local or grabs OS Environment Variables.
2. **Schema Validation**: Parse all variables against a strict schema (e.g. Zod or Python Pydantic).
3. **Check Critical Secrets**: Verify `GEMINI_API_KEY`, `LINKEDIN_ACCESS_TOKEN`, and `DATABASE_URL` exist.
   - If missing: `Hard Panic` immediately (Do not proceed to orchestration).
4. **Determine Model Fallbacks**: If `GEMINI_MODEL` is absent, default securely to `gemini-2.5-flash-lite`.
5. **Inject Context**: Broadcast valid configuration object to all child Agent processes.
