---
name: Project Context & Memory
description: Persistent project memory for the LinkedIn GenAI Automation Ecosystem.
---

# Project Context

## Mission
Operate a fully autonomous 24-hour content generation and publishing cycle for LinkedIn, requiring zero human intervention for compliant posts while maintaining strict governance escalation for edge cases.

## Operational Cadence
| Phase | Time Window | Description |
|---|---|---|
| **Topic Mining** | 00:00 – 02:00 | Topic Planner scans `LinkedIn_Topics.xlsx` and trending signals. |
| **Drafting** | 02:00 – 06:00 | Post Writer, Hashtag Optimizer, and Diagram Generator produce content. |
| **Governance Review** | 06:00 – 08:00 | Reviewer agent evaluates all drafts. Revisions loop if needed. |
| **Publishing** | 08:00 – 10:00 | Publisher agent posts approved content during peak LinkedIn engagement hours. |
| **Analytics Ingestion** | 18:00 – 20:00 | Engagement data is pulled and fed back into the Topic Planner for next-cycle optimization. |
| **Idle / Maintenance** | 20:00 – 00:00 | System health checks, model cache refresh, audit log compaction. |

## Primary Data Source
- **File:** `LinkedIn_Topics.xlsx` (located at project root)
- **Structure:** Contains columns for `Topic`, `Category`, `Priority`, `Last_Published`, `Engagement_Score`, and `Notes`.
- **Usage:** The Topic Planner agent reads this file at the start of each cycle to select the highest-priority, non-duplicate topic.

## Secondary Data Sources
- `data/posted_topics.json` — Running log of all previously published topics (used for deduplication).
- `data/topic_embeddings/` — Vector embeddings of past topics for semantic similarity matching.
- PostgreSQL `engagement_metrics` table — Historical post performance data.

## Key Constraints
1. **No topic repetition** within a 30-day window (semantic similarity threshold: 0.85).
2. **Maximum 1 post per day** to avoid audience fatigue.
3. **All content must pass Reviewer** before reaching Publisher (see `agents.md` Trust Boundaries).
4. **Data residency:** All draft content and audit logs remain within the project infrastructure. No third-party storage.
