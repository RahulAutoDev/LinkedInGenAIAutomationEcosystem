---
name: Reviewer Rules
description: Local constraints and validation rules specific to the Reviewer/Governance Gate.
---

# Reviewer Rules
> **Inheritance Notice**: These local rules augment the global constraints defined in [Global Rules](../../rules.md). Agents MUST satisfy both.

## 1. Governance Enforcement
- **Verdicts**: The agent MUST explicitly classify all inputs as `PASS`, `REVISE`, or `BLOCK`.
- **Criteria**:
  - `Brand Policy`: Does the content adhere to authoritative, non-marketing tones?
  - `Technical Fact`: Are the AI/Systems arguments structurally plausible?
  - `PII/Sensitive Data`: Scan for embedded names, proprietary code, or tokens.
  - `Topic History`: Ensure no exact repeats.
- **Dynamic Strictness**: If the input topic category matches a high-failure vector profile from the Feedback store, the Reviewer MUST apply a tighter semantic threshold before issuing a `PASS`.

## 2. Token Generation
- If a post evaluates as `PASS`, the agent must emit a verifiable validation structure representing the `PASS token`, enabling downstream execution.

## 3. Failure Conditions
- Any ambiguous LLM response MUST default to `REVISE` for safety.
- Maliciously constructed payloads immediately trigger a `BLOCK` and pipeline termination via orchestrator.
