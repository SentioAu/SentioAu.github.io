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
