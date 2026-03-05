# sentioaurum.github.io

SentioAurum official site.

## Domain inventory workflow

The site uses `domains.json` as the single source of truth for the homepage domain cards and dropdown selectors.

### Update domains quickly

1. Edit `domains.csv`.
2. Run:
   ```bash
   python sync_domains.py
   ```
3. Commit both updated files (`domains.csv` and `domains.json`).

This keeps the portfolio list synchronized without manually editing `index.html`.


## Frontend script structure

- `app.js` contains all client-side behavior (domain fetch/render, filters, shortlist, and analytics events).
- `index.html` includes only page markup + GA loader and defers `app.js` for execution.

### Data validation

- `sync_domains.py` validates required columns, detects duplicate domains, and rejects invalid domain-like values before writing `domains.json`.


## Dedicated domain briefs

- Domain-specific brief pages live in `domains/` and are automatically linked in featured cards when a mapping exists in `app.js` (`DOMAIN_BRIEFS`).
- Current phase-2 briefs include select `.ai` domains plus `Dragonfall.com`, `Witchingly.com`, `ChessCourse.com`, and `TheHiveAi.com`.


### Metadata quality (Phase C)

- Keep `category` and `description` populated for high-priority domains to improve featured-card quality and filtering relevance.
- Use concise, buyer-focused descriptions (1 sentence) optimized for conversion intent.


## CI inventory guardrail

- GitHub Actions workflow `validate-inventory.yml` regenerates `domains.json` and fails if it is out-of-sync with `domains.csv`.
- This prevents stale inventory JSON from being merged.
