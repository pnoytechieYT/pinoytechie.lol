# AI guide automation

Writes one guide per run and opens a Pull Request for you to review. Times are Philippine time.

**The guide is written the evening before it goes live** (6:17 PM, and 6:47 PM on Saturday for DITO). It gets the slot below as its `pubDate`, so you can review and merge ahead of time: the site hides it until that time and the 30-minute deploy then publishes it. If you merge after the slot, it goes live right away.

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

The weekly slot (day + time) of each category lives in `automation/config.json` (`day` 1=Mon..7=Sun, `time` HH:MM). The run times live in `.github/workflows/auto-guide.yml`. Each category is one folder in `src/posts/<slug>/`:
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

## Checks before every Pull Request
After the AI writes a guide, the workflow builds the whole site and checks every internal link. The result is written at the bottom of the
Pull Request ("Link check"). If the build or a link fails, the PR says so, and in `publish` mode the guide is sent as a PR instead of going live.

## Choosing your own topic
Actions > **Auto guide (AI)** > Run workflow > fill **Topic** with one sentence, for example `How to open a line on the Smart 5G Max WiFi`, and pick the category.
Leave it empty and the next unwritten topic from the queue is used. A typed topic does not use up the queue. Typos are fine: the AI writes a clean title and the web address comes from that title.
The AI still has no verified facts about a product unless they are in `automation/facts.json` or an existing post, so it writes a general guide and tells readers to check the official app or website. Add the product's details to `facts.json` first if you want specifics.

## Pairing a topic with your own video
Add `"video": "<YouTube id>"` to a topic in `topics.json` (the 11 characters after `v=` in the video's address). The guide then shows that video at the end.
Several queued topics are already paired with videos from your channel.

## Safety nets
- Any peso amount, percentage, speed (Mbps/GB) or USSD code that is not in `facts.json` or your existing posts => the post is saved with `draft: true` and the PR lists what to check.
- External links and unknown internal links are removed. Invented "Sources" sections are removed.
- Every post gets `aiGenerated: true` (the site shows "By Pinoy Techie via AI" under the title).
- **Sources are required.** The AI can only pick source ids from `automation/sources.json` (official sites). The script writes the "Sources" section and checks the pages open. No valid source => `draft: true`. Add or correct entries in that file; prefer the exact page you checked.
- **One guide per category per day.** Drafts and scheduled posts count. If the day is taken the run writes nothing. A manual run with no date picks the category's next free weekly slot; type a date (YYYY-MM-DD) to choose one.
- A very late run (after midnight in Manila) still writes for the correct day.
- A category with no live post stays hidden from the menu and hub, its page is `noindex`, and it is left out of the sitemap, until its first post goes live.

## Modes
Repository variable `AUTO_GUIDE_MODE`: `pr` (default, review first) or `publish` (commit to main; the 30-minute deploy picks it up).

## Local test (no API call)
`node scripts/generate-guide.mjs globe-tm --dry`
