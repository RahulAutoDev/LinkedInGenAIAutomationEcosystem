---
name: Agent Roster & Sovereignty Model
description: Defines the six internal agents, their roles, sovereignty levels, and trust boundaries.
---

# Agent Roster

## Sovereignty Levels
Sovereignty determines the degree of autonomous action an agent can take without external validation.

| Level | Name | Description |
|---|---|---|
| **5** | Full Sovereign | Can execute external actions (e.g., publish to LinkedIn) autonomously. |
| **4** | Constrained Sovereign | Can make internal decisions but requires governance gate for external actions. |
| **3** | Operational | Can read/write internal data and call other agents. Cannot trigger external APIs. |
| **2** | Advisory | Can generate recommendations but cannot write to any persistent store. |
| **1** | Passive | Read-only; observes pipeline state for logging and audit purposes. |

---

## Agent Definitions

### 1. Topic Planner
- **Role:** Analyze `LinkedIn_Topics.xlsx`, trending industry signals, and `posted_topics.json` to select the next content topic. Generate a structured brief with angle, target audience, and key talking points.
- **Sovereignty Level:** 3 (Operational)
- **Skills Used:** `PostgreSQL_Query_Capability`, `Gemini_Pro_Multimodal_Synthesis`
- **Output:** `TopicBrief` JSON object → passed to Post Writer.

### 2. Post Writer
- **Role:** Transform a `TopicBrief` into a fully drafted LinkedIn post optimized for Hook Score and Value Density as defined in `gemini.md`.
- **Sovereignty Level:** 3 (Operational)
- **Skills Used:** `Gemini_Pro_Multimodal_Synthesis`
- **Output:** `DraftPost` JSON object → passed to Hashtag Optimizer and Diagram Generator in parallel.

### 3. Hashtag Optimizer
- **Role:** Analyze the `DraftPost` content and generate 3-5 high-relevance, trending hashtags. Cross-reference against historical engagement data.
- **Sovereignty Level:** 2 (Advisory)
- **Skills Used:** `PostgreSQL_Query_Capability`, `Gemini_Pro_Multimodal_Synthesis`
- **Output:** `HashtagSet` array → merged into `DraftPost`.

### 4. Diagram Generator
- **Role:** Parse the `DraftPost` for technical concepts and generate a Mermaid.js diagram (flowchart, sequence, or architecture) that visually reinforces the post's argument.
- **Sovereignty Level:** 3 (Operational)
- **Skills Used:** `Mermaid_Diagram_Rendering`, `Gemini_Pro_Multimodal_Synthesis`
- **Output:** `.png` image asset → attached to `DraftPost`.

### 5. Reviewer (Compliance & Safety)
- **Role:** **THE GOVERNANCE GATE.** Evaluate the finalized `DraftPost` against enterprise communication policy, brand guidelines, factual accuracy, and regulatory compliance. Issue a `PASS`, `REVISE`, or `BLOCK` verdict.
- **Sovereignty Level:** 4 (Constrained Sovereign)
- **Skills Used:** `Gemini_Pro_Multimodal_Synthesis`, `PostgreSQL_Query_Capability`
- **Output:** `ReviewVerdict` JSON → routes to Publisher (PASS) or back to Post Writer (REVISE).

### 6. Publisher
- **Role:** Take a `PASS`-verified `DraftPost`, format it for the LinkedIn API, attach media assets, and execute the publish call. Log the result to the audit trail.
- **Sovereignty Level:** 5 (Full Sovereign) — **Conditional on Reviewer PASS**
- **Skills Used:** `LinkedIn_API_Access`, `PostgreSQL_Query_Capability`
- **Output:** Published post URL + `AuditLogEntry`.

---

## Trust Boundaries

> [!CAUTION]
> **Hard Constraint:** No content may be published to LinkedIn without receiving an explicit `PASS` verdict from the **Reviewer (Compliance & Safety)** agent. This is a non-negotiable trust boundary.

### Trust Boundary Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    INTERNAL ZONE                        │
│  Topic Planner → Post Writer → Hashtag / Diagram       │
│         (Sovereignty Levels 2-3: No external access)    │
└──────────────────────┬──────────────────────────────────┘
                       │ DraftPost
                       ▼
┌─────────────────────────────────────────────────────────┐
│              GOVERNANCE GATE (Trust Boundary)           │
│                                                         │
│  Reviewer Agent (Sovereignty Level 4)                   │
│  ┌─────────────────────────────────────────────┐        │
│  │ ✓ Brand Compliance        ✓ Factual Check   │        │
│  │ ✓ Tone Validation         ✓ Sensitive Data   │        │
│  │ ✓ Deduplication           ✓ Legal Review     │        │
│  └─────────────────────────────────────────────┘        │
│                                                         │
│  Verdict: PASS | REVISE | BLOCK                         │
└──────────────────────┬──────────────────────────────────┘
                       │ Only on PASS
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   EXTERNAL ZONE                         │
│  Publisher Agent (Sovereignty Level 5)                   │
│  → LinkedIn API Call → Audit Log                        │
└─────────────────────────────────────────────────────────┘
```

### Enforcement Rules
1. **Publisher Lock:** The Publisher agent's `publish()` function requires a cryptographically signed `ReviewVerdict.PASS` token as input. Without it, the API call is blocked at the code level.
2. **Revision Loop:** If the Reviewer issues `REVISE`, the post is returned to the Post Writer with specific feedback. A maximum of 3 revision cycles are allowed before escalation to human review.
3. **Block Escalation:** A `BLOCK` verdict immediately halts the pipeline and sends a notification to the human dashboard (`/apps/web`) with the reason for rejection.
4. **Audit Immutability:** Every verdict (PASS, REVISE, BLOCK) is logged to `packages/governance/audit-log/` with a timestamp, agent ID, and reasoning chain. Logs are append-only.
