#!/usr/bin/env python3
"""Build domains.json from domains.csv for easy portfolio updates."""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CSV_PATH = ROOT / "domains.csv"
JSON_PATH = ROOT / "domains.json"


def parse_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "y"}


def main() -> None:
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Missing input file: {CSV_PATH}")

    domains = []
    with CSV_PATH.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        required = {"name", "category", "description", "featured"}
        missing = required.difference(reader.fieldnames or [])
        if missing:
            raise ValueError(f"domains.csv missing required columns: {sorted(missing)}")

        for row in reader:
            name = (row.get("name") or "").strip()
            if not name:
                continue
            domains.append(
                {
                    "name": name,
                    "category": (row.get("category") or "").strip(),
                    "description": (row.get("description") or "").strip(),
                    "featured": parse_bool(row.get("featured") or "false"),
                }
            )

    JSON_PATH.write_text(json.dumps(domains, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(domains)} domains to {JSON_PATH}")


if __name__ == "__main__":
    main()
