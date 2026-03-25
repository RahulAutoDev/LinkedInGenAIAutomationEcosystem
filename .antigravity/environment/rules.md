---
name: Environment Rules
description: Constraints for managing secure secrets and deployment configurations.
---

# Environment Rules

## 1. Secrets Management
- **No Hardcoding**: API keys, access tokens, and connection strings MUST NEVER be hardcoded in any script or configuration file.
- **Loading Phase**: All secrets MUST be loaded and validated strictly at the bootstrapping phase (e.g., via `dotenv` before orchestrator initialization).

## 2. Configuration Routing
- **Model Agnosticism**: The active LLM model must be configurable via `GEMINI_MODEL`, allowing seamless failover from `Flash` to `Pro`.
- **Environment Parity**: The system must enforce identical structural behavior across `development`, `staging`, and `production` environments via strict runtime flags.
