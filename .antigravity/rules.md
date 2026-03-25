---
name: Global System Rules
description: Immutable rules governing Content Generation, Topic Dedup, Diagrams, Governance, and Retries.
---

# Global System Rules

This document serves as the absolute source of truth for all rules governing the autonomous LinkedIn ecosystem. Agents and orchestrators MUST abide by these constraints.

## Content Rules
1. **JSON Output**: The LLM must output exactly valid JSON matching the schema (`topic`, `post`, `hashtags`, `diagram_mermaid`, `image_prompt`).
2. **Formatting**: Content must use short paragraphs (1-3 lines), plenty of whitespace, maximum 3 emojis, and no marketing jargon.
3. **Structure**: Every post requires a Hook, Insight, Example, Architecture/Workflow thesis, and a clear CTA.

## Topic Dedup Rules
1. **Vector Similarity**: Incoming topics must be vectorized and compared against the historical `posted_topics.json`.
2. **Threshold**: If cosine similarity is > 0.85, the topic is rejected as a duplicate.
3. **Cool-down Period**: No topic can be repeated within a 30-day window under any circumstances.

## Diagram Rules
1. **Format**: All diagrams must be generated using strict Mermaid.js syntax.
2. **Syntax Constraints**: No markdown formatting blocks (e.g., ` ```mermaid `) in the API response. Node labels must be quote-escaped to prevent rendering errors.
3. **Rendering**: The `mmdc` CLI tool must successfully compile the diagram to `.png` before the review stage.

## Review Rules
1. **Brand & Policy Checks**: The Reviewer agent must validate brand safety, technical accuracy, and legal compliance.
2. **Verdicts**: The Reviewer issues exactly one of three verdicts: `PASS`, `REVISE`, or `BLOCK`.
3. **Trust Boundary**: No payload can proceed to the Publisher without a cryptographically valid `PASS` token.

## Publishing & Approval Rules
1. **Human-in-the-Loop**: Until specified otherwise, all generated content requires manual Human Approval via the Dashboard before the Publisher executes the LinkedIn API call.
2. **State Management**: The post payload must strictly transition through states: `DRAFT` → `REVIEW` → `APPROVED` (Human) → `PUBLISHED`.
3. **Payload Construction**: The Publisher assumes all text and media are finalized and simply constructs the LinkedIn UGC payload.

## Retry Rules
1. **Agent Interaction Retries**: The `max_iter` limit for any single agent tool interaction is 5.
2. **Task Revision Loops**: If the Reviewer issues a `REVISE` verdict, the pipeline may retry drafting a maximum of 3 times.
3. **Hard Failure**: Exceeding 3 revisions immediately changes state to `FAILED` and halts the workflow.

## Governance & Routing Rules
1. **Audit Logs**: Every state change, API call, and Reviewer verdict must be written to an immutable JSON audit log.
2. **Model Routing**: Default execution uses `Gemini 2.0 Flash` for speed and cost. Fallback to `Gemini 1.5 Pro` ONLY when the orchestrator encounters repeated formatting errors or complex analytical topics exceeding a predefined perplexity threshold.

## Feedback Learning Rules
1. **Persistent Memory**: System must durability store REVISE/BLOCK reasons in Vector DB.
2. **Continuous Improvement**: Topic generation and Reviewer strictness autonomously adapt based on historical failure signatures.

## Delegation to Local Sub-Rules
Agents must follow these global rules in addition to their domain-specific rules:
- [Topic Planner Rules](agents/topic-planner/rules.md)
- [Content Generator Rules](agents/content-generator/rules.md)
- [Diagram Agent Rules](agents/diagram-agent/rules.md)
- [Reviewer Rules](agents/reviewer/rules.md)
- [Publisher Rules](agents/publisher/rules.md)
- [Scheduler Rules](agents/scheduler/rules.md)
- [Feedback Rules](feedback/rules.md)
- [Environment Rules](environment/rules.md)
- [Persistence Rules](persistence/rules.md)
