---
name: Diagram Agent Rules
description: Local constraints and validation rules specific to the Diagram Agent.
---

# Diagram Agent Rules
> **Inheritance Notice**: These local rules augment the global constraints defined in [Global Rules](../../rules.md). Agents MUST satisfy both.

## 1. Input Constraints
- The `diagram_mermaid` extracted from the draft MUST be sanitized before transmission to the CLI.
- No HTML embeddings or `<style>` tags are permitted within the syntax.

## 2. Rendering Rules
- **Tool Confinement**: The agent MUST use the provided `Mermaid Diagram Renderer Tool` (CLI wrapper) and cannot construct local sub-processes natively.
- **Paths**: Must return absolute or relative pathways securely mapped inside the `data/drafts/` directory.

## 3. Failure Conditions
- If `mmdc` crashes or returns a `stderr`, catch the exception and return a `null` diagram gracefully. Diagrams are optional enhancements, not critical blockers.
