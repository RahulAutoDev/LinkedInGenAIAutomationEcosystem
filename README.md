# LinkedIn GenAI Automation Ecosystem

An autonomous multi-agent content engine for LinkedIn. Transforms raw topics into verified, published posts through a 6-step pipeline with Trust Boundary enforcement.

## Architecture

```
Topic Selection → Drafting → Enhancement → Governance Review → Publishing → Feedback Loop
```

**6 Sovereign Agents** work in concert:
| Agent | Sovereignty Level | Role |
|---|---|---|
| Topic Planner | 3 (Operational) | Selects and briefs topics |
| Post Writer | 3 (Operational) | Generates LinkedIn posts |
| Hashtag Optimizer | 2 (Advisory) | SEO hashtag selection |
| Diagram Generator | 3 (Operational) | Mermaid diagram creation |
| Reviewer | 4 (Constrained) | **Governance Gate** — compliance checks |
| Publisher | 5 (Full Sovereign) | LinkedIn API publishing (requires PASS token) |

## Quick Start

```bash
# 1. Copy environment variables
cp .env.example .env
# Fill in GEMINI_API_KEY and LINKEDIN_API_KEY

# 2. Seed topics
python scripts/seed_topics.py

# 3. Start the API
cd apps/api && uvicorn main:app --reload

# 4. Run a content cycle
python scripts/run_daily_cycle.py
```

## Project Structure

```
LinkedIn_GenAI/
├── .antigravity/          # Agent config layer (skills, agents, workflows)
├── apps/
│   ├── api/               # FastAPI backend
│   ├── web/               # Dashboard (Next.js)
│   └── worker/            # Pipeline orchestrator
├── packages/
│   ├── agents/            # 6 sovereign agents
│   ├── integrations/      # LinkedIn, Gemini, VectorDB, Storage
│   ├── governance/        # Dedupe, Approval, Audit Log, Policy
│   └── shared/            # Types, constants, utilities
├── prompts/               # LLM system prompts
├── scripts/               # Operational scripts
├── docs/                  # Architecture, API, workflow, compliance
├── data/                  # Topics, embeddings, drafts, audit log
└── infra/                 # Docker, CI/CD, cron schedules
```

## Trust Boundary

> **No content is published without a PASS verdict from the Reviewer Agent.** The Publisher verifies an HMAC-signed token before executing any LinkedIn API call. This is non-negotiable.

## Documentation

- [Architecture](docs/architecture.md)
- [API Contracts](docs/api.md)
- [Workflow](docs/workflow.md)
- [Compliance](docs/compliance.md)