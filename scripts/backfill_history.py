"""
backfill_history.py — Backfill Posted Topics History
Pulls historical data and populates posted_topics.json for deduplication.
"""

import json
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent
POSTED_TOPICS_PATH = BASE_DIR / "data" / "posted_topics.json"


def backfill_from_sample():
    """Backfill from sample historical data. In production, pull from LinkedIn API."""
    historical_topics = [
        "Introduction to Multi-Agent Systems",
        "The Rise of Neuromorphic Hardware",
        "Why Digital Twins Matter for Manufacturing",
    ]

    existing = []
    if POSTED_TOPICS_PATH.exists():
        with open(POSTED_TOPICS_PATH, "r") as f:
            existing = json.load(f)

    # Merge without duplicates
    merged = list(set(existing + historical_topics))

    POSTED_TOPICS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(POSTED_TOPICS_PATH, "w") as f:
        json.dump(merged, f, indent=2)

    new_count = len(merged) - len(existing)
    print(f"Backfilled {new_count} new topics. Total: {len(merged)}")


if __name__ == "__main__":
    print("Backfilling history from LinkedIn...\n")
    backfill_from_sample()
    print("\n✓ Backfill complete.")
