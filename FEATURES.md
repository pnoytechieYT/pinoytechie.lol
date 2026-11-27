# Growth features: what they are and where to change them

| Feature | Where | You maintain |
| --- | --- | --- |
| Analytics (cookie-free) | `src/components/Analytics.astro`, `src/data/site.ts` > `analytics` | paste ONE ID (Umami or Cloudflare) |
| Trust layer | `src/pages/editorial-policy.astro`, `src/components/AuthorBox.astro`, `src/data/site.ts` > `author` | your real name, bio, photo, profile links |
| Per-guide share images | `src/pages/og/[slug].png.ts` | nothing (a guide can set its own `image:`) |
| Site search (Pagefind) | `src/pages/search.astro`, `package.json` build script | nothing |
| Savings calculator + rates | `src/pages/tools/savings-interest-calculator.astro`, `src/data/rates.ts`, `src/lib/interest.ts` | **rates + dates in `rates.ts`** |
| Videos in guides | `src/lib/related-video.ts` | `video: "<YouTube id>"` in a guide, or `"video"` on a topic in `automation/topics.json` |
| IndexNow (Bing etc.) | `scripts/indexnow.mjs`, `.github/workflows/indexnow.yml`, `public/<key>.txt` | nothing |
| Link checks | `scripts/check-links.mjs`, `.github/workflows/auto-guide.yml`, `.github/workflows/link-check.yml` | nothing |
| Faster page loads | `astro.config.mjs` > `prefetch` | nothing |

## The savings rates (`src/data/rates.ts`)
This is the one file that must stay true. When a bank changes a rate:
1. Check the **bank's own page**.
2. Edit the number in `tiers`, set `asOf` to today's date (YYYY-MM-DD), and keep the official page in `sources`.
3. Commit. The calculator and the table update on the next deploy.
A row older than 45 days shows a "confirm in the app" warning on its own (change `STALE_AFTER_DAYS` if you want).

## Useful commands
- `npm run build` builds the site and the search index.
- `npm run check:links` checks internal links and anchors of the built site (`node scripts/check-links.mjs --external` also checks links to other websites).
