"""
run_daily_cycle.py — Master Script for 24-Hour Content Cycle
Orchestrates the full pipeline via HTTP calls to the FastAPI backend.
"""

import requests
import time
import json
import sys
from datetime import datetime

API_BASE = "http://localhost:8000"
POLL_INTERVAL = 10  # seconds
MAX_WAIT = 300  # 5 minutes


def check_health():
    """Verify API is online."""
    try:
        resp = requests.get(f"{API_BASE}/health", timeout=5)
        data = resp.json()
        print(f"✓ API Health: {data['status']} | Audit entries: {data['audit_log_entries']}")
        return data["status"] == "healthy"
    except Exception as e:
        print(f"✗ API Health Check Failed: {e}")
        return False


def trigger_cycle():
    """Start a new content generation cycle."""
    print(f"\n{'='*60}")
    print(f"  LinkedIn GenAI — Daily Content Cycle")
    print(f"  Started: {datetime.now().isoformat()}")
    print(f"{'='*60}\n")

    resp = requests.post(f"{API_BASE}/trigger-cycle", timeout=10)
    data = resp.json()
    cycle_id = data["cycle_id"]
    print(f"→ Cycle queued: {cycle_id}")
    return cycle_id


def poll_status(cycle_id: str):
    """Poll cycle status until completion or timeout."""
    elapsed = 0
    while elapsed < MAX_WAIT:
        resp = requests.get(f"{API_BASE}/status/{cycle_id}", timeout=5)
        data = resp.json()
        status = data.get("status", "unknown")
        print(f"  [{elapsed:>3}s] Status: {status}")

        if status in ("completed", "failed", "error", "timeout"):
            return data

        time.sleep(POLL_INTERVAL)
        elapsed += POLL_INTERVAL

    print("✗ Cycle timed out.")
    return {"status": "timeout"}


def print_results(cycle_data: dict):
    """Print cycle results summary."""
    print(f"\n{'─'*60}")
    print(f"  Cycle Result: {cycle_data.get('status', 'unknown').upper()}")
    if cycle_data.get("output"):
        print(f"\n  Output (last 500 chars):")
        print(f"  {cycle_data['output'][-500:]}")
    if cycle_data.get("errors"):
        print(f"\n  Errors:")
        print(f"  {cycle_data['errors']}")
    print(f"{'─'*60}\n")


def fetch_audit_log():
    """Fetch and display recent audit log entries."""
    resp = requests.get(f"{API_BASE}/audit-log?limit=10", timeout=5)
    data = resp.json()
    print(f"\n📋 Recent Audit Log ({data['total']} total entries):")
    for entry in data.get("entries", []):
        print(f"  [{entry.get('timestamp', '?')}] {entry.get('agentId', '?')}: {entry.get('action', '?')}")


def main():
    print("Executing daily MAS content generation cycle...\n")

    # Step 1: Health check
    if not check_health():
        print("\n✗ API is not available. Start the API server first:")
        print("  cd apps/api && uvicorn main:app --reload")
        sys.exit(1)

    # Step 2: Trigger cycle
    cycle_id = trigger_cycle()

    # Step 3: Poll for completion
    result = poll_status(cycle_id)

    # Step 4: Print results
    print_results(result)

    # Step 5: Fetch latest audit log
    try:
        fetch_audit_log()
    except Exception:
        pass

    print("✓ Daily cycle complete.")


if __name__ == "__main__":
    main()
