# LinkedIn GenAI Ecosystem Architecture

## High-Level Overview

The ecosystem operates as an autonomous content engine, transforming raw topics into verified, published LinkedIn content through a multi-agent pipeline. The architecture enforces strict **Trust Boundaries** between content generation and external publication.

## Architectural Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPS LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  /apps/web   │  │ /apps/worker │  │    /apps/api       │    │
│  │  Dashboard   │  │ Orchestrator │  │  FastAPI Backend    │    │
│  └──────────────┘  └──────┬───────┘  └────────────────────┘    │
└────────────────────────────┼────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                   CONTENT BRAIN (Agent Swarm)                    │
│                            │                                     │
│  ┌─────────────┐  ┌───────┴──────┐  ┌──────────────────────┐   │
│  │Topic Planner│→ │ Post Writer  │→ │Hashtag + Diagram     │   │
│  │(Sov. Lvl 3) │  │(Sov. Lvl 3) │  │(Sov. Lvl 2-3)       │   │
│  └─────────────┘  └──────────────┘  └──────────┬───────────┘   │
└───────────────────────────────────────────────────┼─────────────┘
                                                    │ DraftPost
                    ════════════════════════════════ │ ════════════
                         TRUST BOUNDARY (Governance Gate)
                    ════════════════════════════════ │ ════════════
                                                    │
┌───────────────────────────────────────────────────┼─────────────┐
│                   GOVERNANCE LAYER                 │             │
│                                                    ▼             │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────────┐  │
│  │   Dedupe   │  │   Policy   │  │  Reviewer Agent          │  │
│  │   Engine   │  │   Engine   │  │  (Sov. Lvl 4)            │  │
│  └────────────┘  └────────────┘  │  PASS → Token + Publish  │  │
│                                   │  REVISE → Loop to Writer │  │
│  ┌────────────┐  ┌────────────┐  │  BLOCK → Human Dashboard │  │
│  │  Approval  │  │ Audit Log  │  └──────────────────────────┘  │
│  │  (Tokens)  │  │ (Append)   │                                 │
│  └────────────┘  └────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
                                              │ Only on PASS Token
                                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL ZONE                                  │
│  ┌──────────────────────────────────────────────────┐           │
│  │  Publisher Agent (Sov. Lvl 5)                    │           │
│  │  Verifies PASS Token → LinkedIn API → Audit Log  │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Content Brain ↔ Governance Interaction

1. **Content Brain** generates a `DraftPost` through the Topic Planner → Post Writer → Enhancement pipeline.
2. The draft crosses the **Trust Boundary** into the Governance Layer.
3. The **Policy Engine** runs automated checks (sensitive data, emoji limits, prohibited phrases).
4. The **Reviewer Agent** (LLM-powered) evaluates brand compliance, factual accuracy, and overall quality.
5. On **PASS**: A cryptographic HMAC token is generated and passed to the Publisher.
6. On **REVISE**: Specific feedback is sent back to the Post Writer (max 3 cycles).
7. On **BLOCK**: Pipeline halts, human notification sent to dashboard.
8. The **Publisher Agent** verifies the PASS token before executing any LinkedIn API call.
9. All actions are logged to the **Audit Log** (append-only, immutable).

## Technology Stack

| Component | Technology |
|---|---|
| Agent Runtime | TypeScript (ts-node) |
| API Layer | Python FastAPI |
| LLM | Google Gemini 2.5 Pro |
| Diagram Rendering | Mermaid CLI |
| Data Store | JSON files + Vector embeddings |
| Containerization | Docker Compose |
| CI/CD | GitHub Actions |
