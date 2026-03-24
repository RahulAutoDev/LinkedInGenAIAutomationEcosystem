"""
seed_topics.py — Seed Topic Embeddings from LinkedIn_Topics.xlsx
Reads the spreadsheet, generates embeddings, and saves them into data/topic_embeddings/.
"""

import json
import hashlib
import os
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
EMBEDDINGS_DIR = DATA_DIR / "topic_embeddings"


def generate_simple_embedding(text: str) -> list:
    """Generate a simple hash-based embedding (128-dim). Production would use Gemini embeddings."""
    words = text.lower().split()
    embedding = [0.0] * 128
    for word in words:
        h = sum(ord(c) for c in word)
        embedding[h % 128] += 1.0
    norm = sum(v ** 2 for v in embedding) ** 0.5 or 1.0
    return [v / norm for v in embedding]


def seed_from_sample():
    """Seed topics from a hardcoded sample (replace with openpyxl reader for real XLSX)."""
    sample_topics = [
        {"topic": "Neuromorphic Computing in Edge AI", "category": "AI", "priority": 9},
        {"topic": "Multi-Agent Orchestration Patterns", "category": "Architecture", "priority": 8},
        {"topic": "Trust-Constrained Autonomous Systems", "category": "Security", "priority": 7},
        {"topic": "Digital Twins for Industrial Optimization", "category": "Manufacturing", "priority": 8},
        {"topic": "Energy-Delay Product in Agentic Workflows", "category": "Performance", "priority": 6},
        {"topic": "Sovereign AI Governance Frameworks", "category": "Governance", "priority": 9},
        {"topic": "Spiking Neural Networks for Real-Time Processing", "category": "AI", "priority": 7},
        {"topic": "Zero-Trust Architecture in Multi-Agent Systems", "category": "Security", "priority": 8},
        {"topic": "LLM Orchestration for Enterprise Content", "category": "AI", "priority": 7},
        {"topic": "Formal Verification of Autonomous Agents", "category": "Safety", "priority": 6},
    ]

    EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)
    count = 0

    for item in sample_topics:
        topic = item["topic"]
        embedding = generate_simple_embedding(topic)

        filename = topic.lower().replace(" ", "_").replace("/", "_")[:50] + ".json"
        filepath = EMBEDDINGS_DIR / filename

        data = {
            "topic": topic,
            "embedding": embedding,
            "publishedAt": "",  # Not yet published
            "category": item["category"],
            "priority": item["priority"],
        }

        with open(filepath, "w") as f:
            json.dump(data, f, indent=2)

        count += 1
        print(f"  ✓ Seeded: {topic}")

    print(f"\nSeeded {count} topic embeddings into {EMBEDDINGS_DIR}")


if __name__ == "__main__":
    print("Seeding topic embeddings into vector-db...\n")
    seed_from_sample()
    print("\n✓ Seed complete.")
