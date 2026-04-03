# GenAI System Security Policy & Architecture

## 1. Secrets Management
- **Environment Isolation**: All API keys, tokens, and database credentials MUST reside strictly in `.env`.
- **Zero Hardcoding**: Absolute zero tolerance for secrets inside source code, configuration arrays, or UI bundles.
- **Log Masking**: Sensitive variables, particularly the Supabase keys and LinkedIn access arrays, must never be printed to stdout.

## 2. API Security
- **Authentication**: All Next.js Dashboard routes and endpoints are protected by an explicit token-based authorization hook.
- **Payload Validation**: Inputs flowing into the REST APIs MUST map strictly to expected UUID schema arrays and known topics before database binding.

## 3. Authorization constraints
- **Role Scoping**: Only authorized individuals mapping the internal `x-dashboard-token` can execute state changes.
- Restricted hooks include `POST /api/approve`, `POST /api/reject`, `POST /api/regenerate`, and `POST /api/publish`.

## 4. Data Protection & Sanitization
- **Strict Intake**: All dynamic topic strings pulled from Google Sheets undergo Regex-based stripping and character enforcement prior to Vector embedding.
- **Schema Defense**: Validates payload schemas strictly passing out of Gemini (preventing injection loops).

## 5. AI Safety
- **Prompt Injection Defense**: Explicit constraints within `.antigravity/gemini.md` block dangerous directives. 
- **Content Integrity**: Human-in-the-loop (HITL) manual overrides natively gate LinkedIn broadcast sequences. Zero auto-publish allowances.

## 6. Logging & Monitoring
- **Auditor Tracing**: Dashboard approval/rejection actions map explicit user string matrices onto the `public.posts` table (`rejected_by`, `approved_by`).
- **Graceful Failure**: Internal HTTP/Supabase exception traces are masked before returning `500` outputs to the client, preventing architectural leakage.
- **Rate Limiting**: Native token bucket bounds strictly throttle the Next.js API hooks, particularly the `/api/publish` pipeline.
