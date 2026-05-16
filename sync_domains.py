#!/usr/bin/env python3
"""Build domains.json, brief pages, sitemap.xml, and robots.txt from domains.csv."""
from __future__ import annotations

import csv
import html
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
STATIC_PAGES = ["/", "/thank-you.html", "/lease-to-own.html"]


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
        required = {"name", "category", "subcategory", "description", "featured"}
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
                    "subcategory": (row.get("subcategory") or "").strip(),
                    "description": (row.get("description") or "").strip(),
                    "featured": parse_bool(row.get("featured") or "false"),
                }
            )

    JSON_PATH.write_text(json.dumps(domains, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(domains)} domains to {JSON_PATH}")

    write_briefs(domains)
    write_sitemap(domains)
    write_robots()


def brief_slug(name: str) -> str:
    return name.lower().replace(".", "-")


def brief_path_for(name: str) -> Path:
    return DOMAINS_DIR / f"{brief_slug(name)}.html"


BRIEF_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{name} | SentioAurum Domain Brief</title>
  <meta name="description" content="{meta_description}" />
  <link rel="canonical" href="{canonical}" />

  <meta property="og:title" content="{name} | SentioAurum Domain Brief" />
  <meta property="og:description" content="{meta_description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{canonical}" />
  <meta property="og:image" content="{site}/og-image.png" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{name} | SentioAurum Domain Brief" />
  <meta name="twitter:description" content="{meta_description}" />
  <meta name="twitter:image" content="{site}/og-image.png" />

  <link rel="stylesheet" href="../style.css" />

  <script type="application/ld+json">
{jsonld}
  </script>
</head>
<body>
  <main class="section">
    <div class="container">
      <article class="card" style="max-width:780px;margin:0 auto;">
        <p class="eyebrow">{category}{subcategory_badge}</p>
        <h1>{name}</h1>
        <p class="hero-copy">{description_html}</p>
        <ul>
          <li>Premium brand potential for operators and startups</li>
          <li>Secure transfer via escrow workflow</li>
          <li>Fast response for qualified acquisition inquiries</li>
        </ul>
        <div class="hero-actions">
          <a class="btn" href="/#inquire">Inquire Now</a>
          <a class="btn btn-ghost" href="/">Back to Homepage</a>
        </div>
      </article>
    </div>
  </main>
</body>
</html>
"""


def brief_description(item: dict) -> str:
    desc = (item.get("description") or "").strip()
    if desc:
        return desc
    return f"{item['name']} is part of the SentioAurum portfolio and available for acquisition via secure escrow transfer."


def brief_meta_description(item: dict) -> str:
    text = brief_description(item)
    return text if len(text) <= 200 else text[:197].rstrip() + "..."


def brief_jsonld(item: dict) -> str:
    category = item.get("category") or "Portfolio Domain"
    subcategory = item.get("subcategory") or ""
    category_label = f"{category} / {subcategory}" if subcategory else category
    payload = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": item["name"],
        "description": brief_description(item),
        "category": category_label,
        "brand": {"@type": "Brand", "name": "SentioAurum"},
        "url": f"{SITE_ORIGIN}/domains/{brief_path_for(item['name']).name}",
        "offers": {
            "@type": "Offer",
            "url": f"{SITE_ORIGIN}/#inquire",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock",
            "seller": {"@type": "Organization", "name": "SentioAurum"},
        },
    }
    return json.dumps(payload, indent=2)


def write_briefs(domains: list[dict]) -> None:
    DOMAINS_DIR.mkdir(exist_ok=True)
    expected_files: set[str] = set()

    for item in domains:
        path = brief_path_for(item["name"])
        expected_files.add(path.name)
        category = item.get("category") or "Portfolio Domain"
        subcategory = item.get("subcategory") or ""
        subcategory_badge = (
            f' <span class="subcat-badge">{html.escape(subcategory)}</span>'
            if subcategory
            else ""
        )
        rendered = BRIEF_TEMPLATE.format(
            name=html.escape(item["name"]),
            category=html.escape(category),
            subcategory_badge=subcategory_badge,
            description_html=html.escape(brief_description(item)),
            meta_description=html.escape(brief_meta_description(item), quote=True),
            canonical=f"{SITE_ORIGIN}/domains/{path.name}",
            site=SITE_ORIGIN,
            jsonld=brief_jsonld(item),
        )
        path.write_text(rendered, encoding="utf-8")

    removed = 0
    for existing in DOMAINS_DIR.glob("*.html"):
        if existing.name not in expected_files:
            existing.unlink()
            removed += 1

    print(f"Wrote {len(expected_files)} briefs to {DOMAINS_DIR}"
          + (f" (removed {removed} stale)" if removed else ""))


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
