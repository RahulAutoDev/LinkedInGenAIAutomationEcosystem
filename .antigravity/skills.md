# System Capabilities (Skills)

This document defines the core capabilities (skills) available to the LinkedIn GenAI Automation Ecosystem. These skills are utilized by the various autonomous agents to execute the content pipeline.

## 1. Content Generation
- **Provider**: Google Gemini (Flash-lite / Pro)
- **Description**: Generates high-quality, structured LinkedIn posts based on selected topics.
- **Features**:
  - Focuses on Generative AI, Agentic Systems, and AI Architecture.
  - Outputs structured JSON (Hook, Insight, Example, Workflow, CTA, Hashtags).
  - Enforces style guidelines and character limits.

## 2. Topic Intelligence
- **Description**: Identifies and mines unique, high-priority topics for daily content.
- **Features**:
  - Semantic vector similarity checking to prevent topic repetition.
  - Topic history memory tracking.
  - Category prioritization (Generative AI, Agentic AI, AI Architecture).

## 3. Diagram Generation
- **Description**: Creates visual aids to accompany text posts.
- **Features**:
  - **Mermaid.js**: Mandatory format for workflow and architecture diagrams.
  - Renders Mermaid source into publishable PNG images.
  - Optional extensible interface for future image generation models.

## 4. Governance & Review
- **Description**: Automated quality and compliance enforcement (The Governance Gate).
- **Features**:
  - Validates content readability, relevance, and quality.
  - Strict deduplication checks against past historical data.
  - Maintains immutable audit logs for all pipeline actions and verdicts.

## 5. Scheduling
- **Description**: Automated cadence management for the content lifecycle.
- **Features**:
  - Triggers the full multi-agent workflow at a defined cadence (e.g., every 4 days).
  - Cron-based task execution and background polling.

## 6. Publishing
- **Description**: External integration to distribute approved content.
- **Features**:
  - LinkedIn V2 API integration.
  - Supports preferred flow: Draft → Approval → Publish.
  - Requires explicit PASS token from Reviewer for execution (Trust Boundary).
  - Supports manual approval mode for initial production phases.

## 7. Storage
- **Description**: Persistent state and historical memory management.
- **Features**:
  - **PostgreSQL**: Primary relational database for tracking topics, posts, and execution status.
  - **Vector DB / Embeddings**: Stores topic embeddings to enforce semantic deduplication over time.
  - **File System**: Manages temporary drafts, images, and append-only JSON audit logs.
