# Workflow Documentation

## 24-Hour Autonomous Content Cycle

| Phase | Time Window | Agent(s) | Description |
|---|---|---|---|
| Topic Mining | 00:00 – 02:00 | Topic Planner | Scans topics, applies dedup, selects highest priority |
| Drafting | 02:00 – 06:00 | Post Writer, Hashtag, Diagram | Generates draft, hashtags, and visual diagrams |
| Governance | 06:00 – 08:00 | Reviewer | Evaluates compliance, issues PASS/REVISE/BLOCK |
| Publishing | 08:00 – 10:00 | Publisher | Posts approved content to LinkedIn |
| Analytics | 18:00 – 20:00 | (System) | Ingests engagement metrics for feedback loop |
| Maintenance | 20:00 – 00:00 | (System) | Health checks, cache refresh, log compaction |

## Running the Pipeline

```bash
# 1. Start the API
cd apps/api && uvicorn main:app --reload

# 2. Seed topic data
python scripts/seed_topics.py

# 3. Backfill history
python scripts/backfill_history.py

# 4. Run a content cycle
python scripts/run_daily_cycle.py
```
