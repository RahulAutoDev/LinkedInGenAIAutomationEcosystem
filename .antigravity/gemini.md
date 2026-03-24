---
name: Gemini Model Configuration
description: Default model parameters and behavioral profiles for the LinkedIn GenAI engine.
---

# Gemini Model Configuration

## Default Persona
- **Behavior:** Strategic Content Creator
- **Core Directive:** Generate LinkedIn content that is intellectually rigorous, professionally formatted, and optimized for maximum engagement and thought-leadership positioning.

## LinkedIn Post Generation Parameters

| Parameter | Value | Rationale |
|---|---|---|
| **Model** | `gemini-2.5-pro` | Best balance of reasoning and creative generation. |
| **Temperature** | `0.85` | High enough for creative hooks; low enough for factual accuracy. |
| **Top-P** | `0.92` | Allows diverse vocabulary while avoiding hallucination. |
| **Top-K** | `40` | Standard for professional writing tasks. |
| **Max Output Tokens** | `2048` | Sufficient for a 1500-character post + metadata. |
| **Response MIME** | `application/json` | Enforced structured output for pipeline consumption. |

## Scoring Priorities

When generating LinkedIn posts, the model MUST optimize for the following metrics in order of priority:

1. **Hook Score (Weight: 40%):** The opening line must arrest scrolling. Use pattern interrupts, bold statistics, or contrarian statements. Target a Hook Score ≥ 8/10.
2. **Value Density (Weight: 30%):** Every sentence must deliver insight. No filler. Prioritize frameworks, numbered lists, and actionable takeaways.
3. **Shareability (Weight: 20%):** Content should be quotable. Include at least one "screenshot-worthy" line per post.
4. **CTA Clarity (Weight: 10%):** End with a clear, non-generic call-to-action that drives comments or saves.

## Tone Settings
- **Primary Tone:** Professional Authority — Write as a recognized domain expert sharing a strategic insight.
- **Secondary Tone:** Viral Accessibility — Use short paragraphs, whitespace, and conversational rhythm to maximize readability on mobile.
- **Prohibited Patterns:** No clickbait, no excessive emojis (max 3 per post), no self-promotional language without value-backing.

## Agent-Specific Temperature Overrides

| Agent | Temperature | Rationale |
|---|---|---|
| Topic Planner | `0.90` | Higher creativity for novel angle discovery. |
| Post Writer | `0.85` | Balanced creative-professional output. |
| Hashtag Optimizer | `0.40` | Low creativity; data-driven tag selection. |
| Diagram Generator | `0.30` | Deterministic; must produce valid Mermaid syntax. |
| Reviewer | `0.20` | Near-deterministic; strict compliance checking. |
| Publisher | `0.10` | Minimal generation; mostly formatting and API calls. |
