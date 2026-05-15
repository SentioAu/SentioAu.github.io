#!/usr/bin/env python3
"""Build domains.json, sitemap.xml, and robots.txt from domains.csv."""
from __future__ import annotations

import csv
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CSV_PATH = ROOT / "domains.csv"
JSON_PATH = ROOT / "domains.json"
SITEMAP_PATH = ROOT / "sitemap.xml"
ROBOTS_PATH = ROOT / "robots.txt"
DOMAINS_DIR = ROOT / "domains"

SITE_ORIGIN = "https://sentioaurum.com"
STATIC_PAGES = ["/", "/thank-you.html"]


def parse_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "y"}


def validate_domain_name(name: str) -> None:
    if '.' not in name or name.startswith('.') or name.endswith('.'):
        raise ValueError(f"Invalid domain format: {name}")

def main() -> None:
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Missing input file: {CSV_PATH}")

    domains = []
    seen = set()
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
            validate_domain_name(name)
            key = name.lower()
            if key in seen:
                raise ValueError(f"Duplicate domain in CSV: {name}")
            seen.add(key)

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

    write_sitemap(domains)
    write_robots()


def brief_slug(name: str) -> str:
    return name.lower().replace(".", "-")


def brief_path_for(name: str) -> Path:
    return DOMAINS_DIR / f"{brief_slug(name)}.html"


def write_sitemap(domains: list[dict]) -> None:
    today = date.today().isoformat()
    urls: list[tuple[str, str]] = [(f"{SITE_ORIGIN}{path}", "1.0" if path == "/" else "0.5") for path in STATIC_PAGES]

    for item in domains:
        brief_file = brief_path_for(item["name"])
        if brief_file.exists():
            urls.append((f"{SITE_ORIGIN}/domains/{brief_file.name}", "0.7"))

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, priority in urls:
        lines.extend([
            "  <url>",
            f"    <loc>{loc}</loc>",
            f"    <lastmod>{today}</lastmod>",
            f"    <priority>{priority}</priority>",
            "  </url>",
        ])
    lines.append("</urlset>\n")
    SITEMAP_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {len(urls)} URLs to {SITEMAP_PATH}")


def write_robots() -> None:
    content = (
        "User-agent: *\n"
        "Allow: /\n\n"
        f"Sitemap: {SITE_ORIGIN}/sitemap.xml\n"
    )
    ROBOTS_PATH.write_text(content, encoding="utf-8")
    print(f"Wrote {ROBOTS_PATH}")


if __name__ == "__main__":
    main()
