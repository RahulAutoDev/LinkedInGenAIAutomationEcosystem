---
name: LinkedIn GenAI Skill Registry
description: Defines the external toolset available to all agents in the ecosystem.
---

# Skill Registry

## 1. LinkedIn_API_Access
- **Type:** External Integration
- **Endpoint:** `https://api.linkedin.com/v2/ugcPosts`
- **Auth:** OAuth 2.0 Bearer Token (stored in `.env`)
- **Capabilities:**
  - `POST` — Publish text, image, and article posts to a LinkedIn profile or company page.
  - `GET` — Retrieve post analytics (impressions, engagement rate, click-through).
- **Rate Limits:** 100 requests/day per member token.
- **Error Handling:** Retry with exponential backoff on `429 Too Many Requests`.

## 2. PostgreSQL_Query_Capability
- **Type:** Internal Data Layer
- **Connection:** `DATABASE_URL` from `.env`
- **Capabilities:**
  - Read/Write to `posted_topics`, `drafts`, `audit_log`, and `engagement_metrics` tables.
  - Execute parameterized queries for topic deduplication and historical analysis.
- **Security:** All queries are parameterized to prevent SQL injection. Read-only access for Agent roles below Sovereignty Level 3.

## 3. Mermaid_Diagram_Rendering
- **Type:** Local Rendering Engine
- **Tool:** `@mermaid-js/mermaid-cli` (npx)
- **Capabilities:**
  - Convert `.mmd` Mermaid source files into `.png` or `.svg` assets.
  - Supports `graph`, `sequenceDiagram`, `flowchart`, `classDiagram`, and `mindmap` types.
- **Usage:** Called by the `Diagram Generator` agent to create visual assets for LinkedIn carousel posts.

## 4. Gemini_Pro_Multimodal_Synthesis
- **Type:** LLM API (Google DeepMind)
- **Model:** `gemini-2.5-pro`
- **Auth:** `GEMINI_API_KEY` from `.env`
- **Capabilities:**
  - **Text Generation:** Draft posts, hashtags, and governance review judgments.
  - **Image Understanding:** Analyze uploaded diagrams or screenshots for context-aware captioning.
  - **Structured Output:** Return JSON-schema-validated responses for agent input/output contracts.
- **Token Budget:** Max 8192 output tokens per call. System prompt tokens are pre-allocated per agent role.
- **Temperature Settings:** Configured per-agent in `gemini.md`.
