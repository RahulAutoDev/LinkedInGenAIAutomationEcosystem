---
name: Feedback Loop Rules
description: Global constraints for semantic learning and continuous improvement.
---

# Feedback Loop Rules

## 1. Input Signals
- **Rejection Feedback**: Every `REVISE` or `BLOCK` verdict from the Reviewer must be durably stored.
- **Engagement Analytics**: Post-publishing engagement metrics (views, reactions) must be captured continuously.

## 2. Storage & Persistence
- **Vector DB**: Rejected topics and the explicit reason for rejection must be embedded in the Vector DB to train the Topic Planner to avoid similar failing angles.
- **PostgreSQL**: Hard metrics and human-approval overrides must be logged in the relational database.

## 3. Learning Integration
- **Stricter Validation**: If a topic category historically receives high `REVISE` rates, the Reviewer must automatically tighten policy validation for that category.
## 4. Feedback Scoring Engine
- **Quality Score**: Every post must be scored mathematically (1-10) based on `Hook Strength`, `Readability`, and `Value Density`.
- **Classification**:
  - `GOOD` (Score ≥ 8): Topic and structural pattern are marked as highly successful.
  - `BAD` (Score < 8): Topic is flagged for low engagement potential.

## 5. Adaptive Topic Selection
- **Prioritization**: Topics matching the semantic clusters of `GOOD` outputs must be synthetically boosted in the Priority queue (+20%).
- **Deprecation**: Clusters matching `BAD` outputs are penalized (-20%). Topics falling below a baseline threshold are permanently purged.

## 6. Learning from Rejection Patterns
- **Pattern Recognition**: If the Reviewer issues `REVISE` 3+ times across different draft runs for the same fundamental reason (e.g., "Too promotional"), that keyword/angle is extracted and dynamically injected into the Content Generator's negative prompt list permanently.
