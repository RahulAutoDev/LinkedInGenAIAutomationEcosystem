---
name: Content Generator Rules
description: Local constraints and validation rules specific to the Content Generator agent.
---

# Content Generator Rules
> **Inheritance Notice**: These local rules augment the global constraints defined in [Global Rules](../../rules.md). Agents MUST satisfy both.

## 1. Formatting Constraints
- **Structured LLM Output**: The agent's LLM response MUST rigidly adhere to the designated JSON format (no markdown blocks).
- **Paragraphs**: Keep to 1-3 lines maximum.
- **Engagement Details**: Generate exactly 3-5 hashtags per post, appended to an array.

## 2. Revision Rules
- **Iterative Drafting**: If `revisionFeedback` is present in the input, the agent MUST explicitly address the Reviewer's feedback in the newly drafted text.
- **Historical Context**: The agent SHOULD utilize previously stored successful "Hooks" from the Feedback Database to inform its structural style.

## 3. Failure Conditions
- If JSON parsing fails due to malformed LLM string outputs, trigger a `ParsingError` and re-kick the LLM prompt inside the `max_retries` window.
