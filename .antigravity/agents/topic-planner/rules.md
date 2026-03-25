---
name: Topic Planner Rules
description: Local constraints and validation rules specific to the Topic Planner agent.
---

# Topic Planner Rules
> **Inheritance Notice**: These local rules augment the global constraints defined in [Global Rules](../../rules.md). Agents MUST satisfy both.

## 1. Input Constraints
- **Topic Pool**: MUST pull from verified data sources only.
- **Deduplication Validation**: ALL incoming candidates MUST be piped through the `Vector DB Deduplication Tool`.

## 2. Topic Output Rules
- **No Repetition**: Any topic scoring `> 0.85` similarity against `posted_topics.json` or returning `True` from the vector tool MUST be immediately discarded.
- **Avoid Rejected Vectors**: Vector similarity against the `rejected_topics` Vector DB cluster MUST be `< 0.70` to ensure the system learns not to try failed angles again.
- **Brief Structure**: The selected topic MUST be summarized into a `TopicBrief` containing: `angle`, `target_audience`, and `talking_points`.

## 3. Failure Conditions
- If the Vector DB fails to respond, fallback to exact string matching on historical topics.
- If all candidates are marked as duplicates, the agent MUST return a fatal `EXHAUSTED_TOPICS` error.
