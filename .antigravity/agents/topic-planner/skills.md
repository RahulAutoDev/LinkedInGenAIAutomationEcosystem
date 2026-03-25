# Topic Planner Skills

## Responsibility
The Topic Planner is responsible for mining, generating, and selecting unique, high-priority topics for the content pipeline. It serves as the initial spark for the daily content cycle.

## Core Capabilities
- **Candidate Generation**: Mines historical data, trending themes, and predefined priorities to create a list of candidate topics.
- **Deduplication**: Semantically compares candidate topics against the local `posted_topics` database (using vector embeddings) to ensure absolute uniqueness and prevent repetition.
- **Prioritization**: Ranks the deduplicated topics based on relevance to Generative AI, Agentic Systems, and AI Architecture.

## Inputs
- `raw_candidates`: List of predefined or mined topic strings.
- `historical_topics`: Database or list of previously posted topics for dedup.

## Outputs
- `TopicBrief`: Structured JSON containing the selected topic, angle, target audience, and suggested format.

## Dependencies
- Vector DB (for semantic similarity checking).
- PostgreSQL / JSON Store (for historical topic retrieval).
