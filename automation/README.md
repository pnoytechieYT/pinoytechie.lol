# AI guide automation

Writes one guide per run and opens a Pull Request for you to review.

| Time (Manila) | Category |
| --- | --- |
| 9:00 AM  | MariBank |
| 12:00 PM | GCash |
| 3:00 PM  | Maya |

## One-time setup
1. Create a free key at Google AI Studio (Gemini). Optional backups: Groq, DeepSeek.
2. GitHub repo > Settings > Secrets and variables > Actions > **New repository secret**
   - `GEMINI_API_KEY` (and optionally `GROQ_API_KEY`, `DEEPSEEK_API_KEY`)
3. GitHub repo > Settings > Actions > General > Workflow permissions:
   - choose **Read and write permissions**
   - tick **Allow GitHub Actions to create and approve pull requests**
4. Test it: Actions tab > **Auto guide (AI)** > Run workflow.

## Files you maintain
- `automation/facts.json`: your verified rates, fees and limits. **The AI may only use numbers from here and from your existing posts.** Update it whenever something changes.
- `automation/topics.json`: the queue. Add topics at the bottom. A topic is done when `src/posts/<category>/<slug>.md` exists.

## Safety nets
- Any peso amount or percentage not found in `facts.json` or your existing posts => the post is saved with `draft: true` and the PR lists the numbers to check.
- External links and unknown internal links are removed. Invented "Sources" sections are removed.
- Every post gets `aiGenerated: true` (the site's AI badge).

## Modes
Repository variable `AUTO_GUIDE_MODE`: `pr` (default, review first) or `publish` (commit to main; the 30-minute deploy picks it up).

## Local test (no API call)
`node scripts/generate-guide.mjs maya --dry`
