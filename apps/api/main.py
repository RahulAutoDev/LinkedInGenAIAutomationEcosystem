"""
LinkedIn GenAI Automation — FastAPI Backend
Endpoints: /trigger-cycle, /status, /audit-log, /drafts, /topics
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
import subprocess
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

app = FastAPI(
    title="LinkedIn GenAI Orchestration API",
    description="Backend API for the LinkedIn Content Automation Ecosystem",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
AUDIT_LOG_PATH = DATA_DIR / "audit_log.json"
POSTED_TOPICS_PATH = DATA_DIR / "posted_topics.json"
DRAFTS_DIR = DATA_DIR / "drafts"

# In-memory cycle tracking
active_cycles: dict = {}


class CycleResponse(BaseModel):
    cycle_id: str
    status: str
    message: str


class TopicEntry(BaseModel):
    topic: str
    category: str
    priority: int = 5
    notes: str = ""


# ─── Utility Functions ───

def read_json_file(path: Path, default=None):
    if not path.exists():
        return default if default is not None else []
    with open(path, "r") as f:
        return json.load(f)


def write_json_file(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


# ─── Endpoints ───

@app.get("/")
def read_root():
    return {
        "status": "LinkedIn GenAI API Online",
        "version": "1.0.0",
        "endpoints": ["/trigger-cycle", "/status/{cycle_id}", "/audit-log", "/drafts", "/topics"],
    }


@app.post("/trigger-cycle", response_model=CycleResponse)
def trigger_cycle(background_tasks: BackgroundTasks):
    """Trigger a new content generation cycle."""
    cycle_id = str(uuid.uuid4())
    active_cycles[cycle_id] = {
        "status": "queued",
        "started_at": datetime.utcnow().isoformat(),
        "completed_at": None,
    }

    def run_cycle(cid: str):
        active_cycles[cid]["status"] = "running"
        try:
            # Execute the CrewAI pipeline via subprocess
            result = subprocess.run(
                ["python", str(BASE_DIR / "apps" / "crewai" / "main.py")],
                capture_output=True,
                text=True,
                timeout=300,
                cwd=str(BASE_DIR),
            )
            active_cycles[cid]["status"] = "completed" if result.returncode == 0 else "failed"
            active_cycles[cid]["output"] = result.stdout[-2000:] if result.stdout else ""
            active_cycles[cid]["errors"] = result.stderr[-1000:] if result.stderr else ""
        except subprocess.TimeoutExpired:
            active_cycles[cid]["status"] = "timeout"
        except Exception as e:
            active_cycles[cid]["status"] = "error"
            active_cycles[cid]["errors"] = str(e)
        finally:
            active_cycles[cid]["completed_at"] = datetime.utcnow().isoformat()

    background_tasks.add_task(run_cycle, cycle_id)

    return CycleResponse(
        cycle_id=cycle_id,
        status="queued",
        message="Content generation cycle queued. Use /status/{cycle_id} to track progress.",
    )


@app.get("/status/{cycle_id}")
def get_cycle_status(cycle_id: str):
    """Get the status of a content generation cycle."""
    if cycle_id not in active_cycles:
        raise HTTPException(status_code=404, detail=f"Cycle {cycle_id} not found.")
    return active_cycles[cycle_id]


@app.get("/audit-log")
def get_audit_log(limit: int = 50, agent_id: Optional[str] = None):
    """Retrieve the governance audit log."""
    entries = read_json_file(AUDIT_LOG_PATH, [])
    if agent_id:
        entries = [e for e in entries if e.get("agentId") == agent_id]
    return {"total": len(entries), "entries": entries[-limit:]}


@app.get("/drafts")
def list_drafts():
    """List all saved drafts."""
    if not DRAFTS_DIR.exists():
        return {"drafts": []}
    files = [f.name for f in DRAFTS_DIR.iterdir() if f.suffix == ".json"]
    drafts = []
    for f in files:
        data = read_json_file(DRAFTS_DIR / f)
        drafts.append({"filename": f, "data": data})
    return {"total": len(drafts), "drafts": drafts}


@app.get("/topics")
def list_topics():
    """List all posted topics."""
    topics = read_json_file(POSTED_TOPICS_PATH, [])
    return {"total": len(topics), "topics": topics}


@app.post("/topics")
def add_topic(entry: TopicEntry):
    """Add a new topic to the pipeline."""
    topics = read_json_file(POSTED_TOPICS_PATH, [])
    # We store just topic strings in posted_topics for dedup; full data stays in XLSX
    return {"message": f"Topic '{entry.topic}' noted. Add to LinkedIn_Topics.xlsx for pipeline inclusion."}


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "data_dir_exists": DATA_DIR.exists(),
        "audit_log_entries": len(read_json_file(AUDIT_LOG_PATH, [])),
    }
