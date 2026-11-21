# Pinoy Techie (pinoytechie.lol)

Astro + Tailwind CSS v4 site, deployed to GitHub Pages by `.github/workflows/deploy.yml`.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:4321 (shows scheduled posts with a badge)
npm run build      # production build into dist/ (hides scheduled posts)
npm run preview    # serve the production build
```

Requires Node.js 20.3+ (the deploy workflow uses Node 22).

## Writing a post

Create `src/posts/my-new-post.md`. The file name becomes the URL (`/blog/my-new-post/`).

```md
---
title: "MariBank vs GCash: which should you use in 2026?"
seoTitle: "MariBank vs GCash in 2026"          # optional, shorter title for Google (50-60 chars)
description: "One or two sentences, 120-160 characters."
pubDate: "2026-11-25T09:00:00+08:00"            # date AND time, always in quotes
updatedDate: "2026-12-02T14:30:00+08:00"        # optional, set when you change the article
tags: ["MariBank", "Comparison"]
draft: false                                    # true = never published
---

Your article in Markdown. Use ## headings, they become the table of contents.
```

### Scheduling

`pubDate` is a date-time. `+08:00` means Philippine time (if you leave the offset off, Philippine time is assumed).

- `pubDate` in the **past or now**: the post is public.
- `pubDate` in the **future**: the post is a scheduled post. It is left out of the blog list, tag pages, its own page, RSS, the sitemap and `llms.txt` until that time passes.
- The deploy workflow rebuilds the site **every 30 minutes**, so a scheduled post goes live within about 30 minutes after its time.
- `draft: true` always hides a post.

GitHub pauses scheduled workflows in a public repo after 60 days with no commits. If scheduled posts ever stop going live, push any commit or press "Run workflow" under the Actions tab.

## Where things live

| What | File |
| --- | --- |
| Site name, nav, referral code and reward, FAQ, social links | `src/data/site.ts` |
| Videos (add, feature, categorize) | `src/data/videos.ts` |
| Markdown plugins (callouts, tables, anchors, code blocks) | `src/plugins/markdown.mjs`, config in `astro.config.mjs` |
| Colors and article typography | `src/styles/global.css` |
| Page `<head>`, Open Graph, JSON-LD | `src/components/Seo.astro`, `src/lib/seo.ts` |
| Post loading and scheduling logic | `src/lib/posts.ts` |
| Home page sections | `src/components/sections/` |
| Pages | `src/pages/` (about, contact, videos, disclosure, privacy-policy, terms, blog) |
| Logo and icons | `public/logo*.png`, `public/icon-*.png`, `public/favicon.ico`, `public/og-default.png` |

## Routine updates

- New promo terms: edit the `referral` block in `src/data/site.ts` and bump `referral.updated`.
- Add your contact email: set `social.email` in `src/data/site.ts` (it appears on Contact, About, Privacy and in schema).
- More videos: add entries to `videos` in `src/data/site.ts`.
- Legal pages changed: bump `legalUpdated` in `src/data/site.ts`.

## Markdown features in posts

Everything below is styled automatically in `src/styles/global.css`.

```md
## Heading 2 / ### Heading 3 / #### Heading 4      (h2-h4 get a # link on hover; h2/h3 fill "On this page")
**bold**  *italic*  ~~strike~~  `inline code`  <mark>highlight</mark>  <kbd>Ctrl</kbd>  H<sub>2</sub>O
- bullets, 1. numbered, nested lists, and task lists:  - [x] done  - [ ] todo
| Tables | with | alignment |   (wrapped in a scrollable box on phones)
> Quote
> [!TIP] Optional title
> Callout text.            (also NOTE, INFO, IMPORTANT, WARNING, CAUTION, EXAMPLE)
![Alt text](/image.png "Caption shown under the image")
Footnote[^1]  ...  [^1]: The footnote text.
<details><summary>Click to expand</summary>Hidden text</details>
--- (divider)
```

Fenced code blocks get syntax highlighting, a language label and a Copy button.
Leftover `[citation:7]` tags pasted from AI tools are removed automatically.

## Videos

Edit `src/data/videos.ts`. Set `featured: true` to pin a video at the top of `/videos/`
(the first featured video is also the one on the home page). Give videos a `category`
and filter buttons appear on `/videos/` automatically.

## Theme (light / dark / system) and glass style

- The header switch has three modes: System (default, follows the device), Light and Dark. The choice is saved in `localStorage` (`theme`) and applied before first paint by the inline script in `src/components/Seo.astro`.
- Colors are tokens in `src/styles/global.css` (`:root` for light, `.dark` for dark): `text-ink`, `text-body`, `text-muted`, `border-line`, `bg-soft`, `bg-tint`, `text-accent`, `bg-btn`. Use these instead of `text-slate-*` / `bg-white` so both themes keep working.
- Glass surfaces: `glass` (cards, bands), `glass-strong` (forms), `glass-dark` (dark panels), `glass-bar` (header). The colored glow they blur is `--page-glow`. Blur turns off automatically when the visitor asks for reduced transparency.
