# SentioAurum

The official site for **SentioAurum** — an independent studio building a small
network of web tools. *Sentio Aurum* — "to sense gold."

The site is intentionally minimal: one statement, and an editorial index that
routes visitors out to the studio's live products (the "Network").

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | The single-page studio landing. |
| `style.css` | All styling — atmospheric dark theme, gold accents, editorial index. |
| `app.js` | Tiny: entrance reveal, footer year, network + mailto analytics. |
| `404.html` | Branded not-found page (retired URLs also 301 via `_redirects`). |
| `favicon.svg` | Gold "SA" monogram (source of the PNG icons). |
| `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest` | App icons + PWA manifest. Regenerate icons with `python build_icons.py`. |
| `og-image.png` | Social preview (1200×630). Regenerate with `python build_og_image.py`. |
| `_headers`, `_redirects` | Cloudflare security/cache headers + redirects for retired paths. |
| `sitemap.xml`, `robots.txt` | SEO. |

## The Network

Products are hard-coded in `index.html` (the `.index-list`). To add one, copy an
`<li>` row, bump the number, and set the name / note / URL. Keep the roster small
— that's the point.

Current: EmpireCalc · AlHasebah · MorseCodeGenerator · EspressoFit · BrailleChart (+ PlayersB).
Remember to bump the `.index-count` label ("Five live products") when the roster changes.

## Analytics

Google Analytics (GA4) `G-VBQJ0Q5J39` is loaded in `index.html`. Outbound clicks
to network products fire a `network_click` event.

## Contact

The site links to `studio@sentioaurum.com` (top bar + footer). Point that mailbox
at your inbox (or change the two `mailto:` links in `index.html`).

## Deploy — Cloudflare Pages

Static site, no build step. From the project root:

```bash
npx wrangler pages deploy
```

`wrangler.toml` sets `pages_build_output_dir = "."`, so no directory argument is
needed. `.assetsignore` keeps source/tooling files out of the upload; `_headers`
sets security + cache headers.

First-time setup: `npx wrangler login`, then run the deploy. Configure the custom
domain `sentioaurum.com` in the Cloudflare Pages dashboard.

## Note

The former domain-portfolio / marketplace has been retired from the live site and
preserved in git history — it can be reintroduced later once traffic grows.
