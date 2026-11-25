# AI guide automation

Writes one guide per run and opens a Pull Request for you to review. Times are Philippine time.

| Day | Time | Category | Group |
| --- | --- | --- | --- |
| Monday | 12:00 PM | MariBank | Banks & E-Wallets |
| Tuesday | 12:00 PM | GCash | Banks & E-Wallets |
| Wednesday | 12:00 PM | Maya | Banks & E-Wallets |
| Thursday | 12:00 PM | More Banks & E-Wallets | Banks & E-Wallets |
| Friday | 12:00 PM | Globe / TM | Internet Providers |
| Saturday | 12:00 PM | Smart / TNT / Sun | Internet Providers |
| Sunday | 9:00 AM | DITO | Internet Providers |
| Sunday | 12:00 PM | More Internet Providers | Internet Providers |

The schedule lives in `.github/workflows/auto-guide.yml`. Each category is one folder in `src/posts/<slug>/`:
`maribank`, `gcash`, `maya`, `more-banks-ewallets`, `globe-tm`, `smart-tnt-sun`, `dito`, `more-internet-providers`.

## One-time setup
1. Create a free key at Google AI Studio (Gemini). Backups: **GitHub Models works with no key** (the workflow has `models: read`). Optional: Groq, Mistral, DeepSeek keys.
2. GitHub repo > Settings > Secrets and variables > Actions > **New repository secret**: `GEMINI_API_KEY` (and optionally `GROQ_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`).
3. GitHub repo > Settings > Actions > General > Workflow permissions: **Read and write permissions** and tick **Allow GitHub Actions to create and approve pull requests**.
4. Test it: Actions tab > **Auto guide (AI)** > Run workflow > pick a category.

## Files you maintain
- `automation/facts.json`: your verified numbers (`global`, `banks`, `providers`, or one list per category). **The AI may only use numbers from here and from your existing posts.** Update it whenever something changes.
- `automation/topics.json`: your own topic list (optional, 7 starter topics per category).
- `automation/topics-ai/<category>.json`: topics the AI proposed. **You don't write these.** When a category's queue is empty, the AI proposes about 10 new topics and they arrive in the same Pull Request as that day's guide.
- `automation/config.json`: what each category is about (used in the AI prompt).

## Safety nets
- Any peso amount, percentage, speed (Mbps/GB) or USSD code that is not in `facts.json` or your existing posts => the post is saved with `draft: true` and the PR lists what to check.
- External links and unknown internal links are removed. Invented "Sources" sections are removed.
- Every post gets `aiGenerated: true` (the site's AI badge).
- A category with no live post stays hidden from the menu and hub, its page is `noindex`, and it is left out of the sitemap, until its first post goes live.

## Modes
Repository variable `AUTO_GUIDE_MODE`: `pr` (default, review first) or `publish` (commit to main; the 30-minute deploy picks it up).

## Local test (no API call)
`node scripts/generate-guide.mjs globe-tm --dry`
