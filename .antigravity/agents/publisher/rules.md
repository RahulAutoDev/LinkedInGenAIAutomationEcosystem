---
name: Publisher Rules
description: Local constraints and validation rules specific to the Publisher Agent.
---

# Publisher Rules
> **Inheritance Notice**: These local rules augment the global constraints defined in [Global Rules](../../rules.md). Agents MUST satisfy both.

## 1. Trust Boundary Enforcement
- **Gate Check**: The Publisher MUST verify the existence and integrity of a signed `PASS` token before compiling any API requests.
- **Fail-open prevention**: Missing or invalid tokens MUST trigger an immediate local panic/failure. Nothing is published.

## 2. Data Transformation
- **LinkedIn Payload**: Text, line breaks, emojis, and hashtags must be properly UTF-8 encoded.
- **Media Upload**: Diagrams MUST be correctly encoded and pushed via the LinkedIn UGC Assets API prior to attaching to the main post payload.

## 3. Failure Conditions
- **Network Timeouts**: API timeout or `500` errors trigger exponential backoff retries.
- **Invalid Auth**: `401 Unauthorized` triggers immediate pipeline halt (do not retry).
