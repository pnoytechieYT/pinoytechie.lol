/**
 * Writes ONE new guide with AI and saves it as src/posts/<category>/<slug>.md
 *
 *   CATEGORY=maribank node scripts/generate-guide.mjs        (maribank | gcash | maya)
 *   node scripts/generate-guide.mjs gcash --dry              (shows the chosen topic and prompt size, no API call)
 *
 * How it works
 *   1. Takes the next topic of that category from automation/topics.json
 *      (a topic is "done" when a file named <slug>.md already exists in src/posts).
 *   2. Gives the AI your verified facts (automation/facts.json) plus your existing posts
 *      of that category as source material, and tells it NOT to invent numbers.
 *   3. Tries the providers in order (Gemini, Groq, DeepSeek). The first one with a key
 *      that answers wins. All three speak the same OpenAI-style API.
 *   4. Cleans the result, checks internal links, flags every peso amount / percentage
 *      that is NOT found in your facts or source posts, and writes the file.
 *      Any flagged number => the post is saved with `draft: true` so it can never go live unseen.
 *
 * Keys (GitHub: Settings > Secrets and variables > Actions). Use any one, or all for fallback:
 *   GEMINI_API_KEY, GROQ_API_KEY, DEEPSEEK_API_KEY
 * Optional: GEMINI_MODEL, GROQ_MODEL, DEEPSEEK_MODEL (each can be a comma-separated list tried in order), AI_PROVIDERS="gemini,groq,deepseek"
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "src", "posts");
const TOPICS_FILE = path.join(ROOT, "automation", "topics.json");
const FACTS_FILE = path.join(ROOT, "automation", "facts.json");
const REPORT_FILE = path.join(ROOT, ".autoguide-report.md");

const CATEGORY = (process.env.CATEGORY || process.argv.find((a, i) => i > 1 && !a.startsWith("--")) || "").toLowerCase();
const DRY = process.env.DRY_RUN === "1" || process.argv.includes("--dry");
const RETRY_MS = Number(process.env.RETRY_DELAY_MS ?? 20_000);
const BRAND = { maribank: "MariBank", gcash: "GCash", maya: "Maya" };

const PROVIDERS = {
	gemini: {
		base: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai",
		key: process.env.GEMINI_API_KEY,
		models: (process.env.GEMINI_MODEL || "gemini-flash-latest,gemini-flash-lite-latest").split(","),
	},
	groq: {
		base: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
		key: process.env.GROQ_API_KEY,
		models: (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").split(","),
	},
	deepseek: {
		base: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
		key: process.env.DEEPSEEK_API_KEY,
		models: (process.env.DEEPSEEK_MODEL || "deepseek-flash").split(","),
	},
};

const log = (m) => console.log(`[auto-guide] ${m}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = (m) => {
	console.error(`::error title=Auto guide::${m}`);
	process.exit(1);
};

// ---------- reading the site's existing posts ----------

async function walk(dir) {
	const out = [];
	for (const e of await fs.readdir(dir, { withFileTypes: true })) {
		const full = path.join(dir, e.name);
		if (e.isDirectory()) out.push(...(await walk(full)));
		else if (e.name.endsWith(".md")) out.push(full);
	}
	return out;
}

function splitPost(text) {
	const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	return m ? { fm: m[1], body: m[2] } : { fm: "", body: text };
}
const fmField = (fm, key) => fm.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]?.trim().replace(/^["']|["']$/g, "") ?? "";

async function loadExisting() {
	const posts = [];
	for (const file of await walk(POSTS_DIR)) {
		const { fm, body } = splitPost(await fs.readFile(file, "utf8"));
		posts.push({
			slug: path.basename(file, ".md"),
			category: path.basename(path.dirname(file)),
			title: fmField(fm, "title"),
			description: fmField(fm, "description"),
			tags: fmField(fm, "tags"),
			body,
		});
	}
	return posts;
}

const STOP = new Set("the a an and or of to in on for with how what is are your you from vs 2026 guide".split(" "));
const words = (s) => new Set(s.toLowerCase().match(/[a-z0-9]+/g)?.filter((w) => w.length > 2 && !STOP.has(w)) ?? []);

function pickSources(existing, topic) {
	const want = words(`${topic.title} ${topic.angle ?? ""}`);
	return existing
		.filter((p) => p.category === CATEGORY)
		.map((p) => {
			const have = words(`${p.title} ${p.description} ${p.tags}`);
			let score = 0;
			for (const w of want) if (have.has(w)) score++;
			return { p, score };
		})
		.sort((a, b) => b.score - a.score)
		.slice(0, 3)
		.map(({ p }) => {
			const clean = p.body.split(/\n## Sources/i)[0].trim().slice(0, 3000);
			return `### ${p.title}\n${clean}`;
		})
		.join("\n\n");
}

function factsText(facts) {
	const block = (label, items) => (items?.length ? `${label}:\n${items.map((f) => `- ${f}`).join("\n")}` : "");
	return [
		block("General", facts.global),
		block("MariBank", facts.maribank),
		block("GCash", facts.gcash),
		block("Maya", facts.maya),
	]
		.filter(Boolean)
		.join("\n\n");
}

// ---------- prompt ----------

const SYSTEM = `You write guides for Pinoy Techie, an independent Philippine website that explains MariBank, GCash and Maya in plain language.

VOICE: clear, calm, helpful English for Filipino readers. Short paragraphs. Say "you". No hype, no "best ever", no promises of returns, no financial advice.

STRUCTURE (Markdown, no H1 because the page title is added separately):
- Open with 2 to 4 sentences that answer the question straight away.
- Then 4 to 7 sections with "##" headings. Use "###" sparingly. Use bullet lists, numbered steps and one Markdown table when it helps.
- You may add callouts in exactly this form: "> [!NOTE] Short title" or "> [!WARNING] Short title" on one line, then "> text" on the next line.
- End with a short "##" section that helps the reader decide (who it suits, what to check first).
- 900 to 1,400 words in total.

HARD RULES (follow them even if the topic seems to need otherwise):
1. NUMBERS: never write a peso amount, percentage, interest rate, fee, limit, date or deadline unless it appears word for word in FACTS or SOURCE POSTS. If you need one that is missing, tell the reader to check the figure in the official app instead. Never estimate or round.
2. CLAIMS: when you state something a company says, say "According to <company>" and only if it is in FACTS or SOURCE POSTS.
3. LINKS: no external links, no URLs, no phone numbers, no email addresses. Internal links are allowed only from the EXISTING GUIDES list, written as [anchor text](/blog/slug/).
4. Do not write a "Sources" section, a date line, or any note about being an AI. Do not invent screens, menu names or steps you are not sure about; describe the general flow and say menus can differ by app version.
5. No fake quotes, no fake reviews, no invented statistics.

OUTPUT: only a JSON object, no code fences, with these keys:
{"title": "...", "seoTitle": "50-60 characters", "description": "140-160 characters", "tags": ["3 to 5 short tags"], "body": "the Markdown article"}`;

function buildUser({ topic, facts, sources, existing }) {
	const guides = existing.map((p) => `- ${p.slug}: ${p.title}`).join("\n");
	return `CATEGORY: ${BRAND[CATEGORY]}
TOPIC: ${topic.title}
ANGLE: ${topic.angle ?? "Answer the reader's main question first, then explain the details."}

FACTS (verified by the site owner; the only numbers you may use besides the SOURCE POSTS):
${facts || "(none yet)"}

SOURCE POSTS (already published on the site, treat as verified; match their tone):
${sources || "(none)"}

EXISTING GUIDES you may link to:
${guides}

Write the guide now. Return only the JSON object.`;
}

// ---------- calling the AI ----------

async function chat(p, model, system, user) {
	const body = {
		model,
		temperature: 0.4,
		max_tokens: 8000,
		response_format: { type: "json_object" },
		messages: [
			{ role: "system", content: system },
			{ role: "user", content: user },
		],
	};
	for (let attempt = 1; attempt <= 3; attempt++) {
		let res;
		try {
			res = await fetch(`${p.base}/chat/completions`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.key}` },
				body: JSON.stringify(body),
				signal: AbortSignal.timeout(180_000),
			});
		} catch (e) {
			if (attempt < 3) {
				await sleep(RETRY_MS);
				continue;
			}
			throw new Error(`network error (${e.cause?.code ?? e.message})`);
		}
		if (res.ok) {
			const data = await res.json();
			const text = data.choices?.[0]?.message?.content;
			if (!text) throw new Error("empty answer");
			return text;
		}
		const detail = (await res.text()).replace(/\s+/g, " ").slice(0, 250);
		if (res.status === 400 && body.response_format) {
			delete body.response_format; // some models reject JSON mode; the prompt already asks for JSON
			continue;
		}
		if ((res.status === 429 || res.status >= 500) && attempt < 3) {
			await sleep(RETRY_MS * attempt);
			continue;
		}
		throw new Error(`HTTP ${res.status} ${detail}`);
	}
	throw new Error("gave up after 3 tries");
}

function parseJson(text) {
	const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
	const a = t.indexOf("{");
	const b = t.lastIndexOf("}");
	if (a < 0 || b < a) throw new Error("no JSON in answer");
	return JSON.parse(t.slice(a, b + 1));
}

const countWords = (s) => s.split(/\s+/).filter(Boolean).length;

async function generate(system, user) {
	const order = (process.env.AI_PROVIDERS || "gemini,groq,deepseek")
		.split(",")
		.map((s) => s.trim().toLowerCase())
		.filter((n) => PROVIDERS[n]?.key);
	if (!order.length) fail("No AI key found. Add GEMINI_API_KEY, GROQ_API_KEY or DEEPSEEK_API_KEY as a repository secret.");

	const errors = [];
	for (const name of order) {
		const p = PROVIDERS[name];
		for (const model of p.models.map((m) => m.trim()).filter(Boolean)) {
			try {
				log(`asking ${name} (${model})`);
				const data = parseJson(await chat(p, model, system, user));
				if (typeof data.title !== "string" || typeof data.body !== "string") throw new Error("JSON is missing title or body");
				if (countWords(data.body) < 600) throw new Error(`article too short (${countWords(data.body)} words)`);
				return { data, provider: name, model };
			} catch (e) {
				log(`${name}/${model} failed: ${e.message}`);
				errors.push(`${name}/${model}: ${e.message}`);
			}
		}
	}
	fail(`Every provider failed. ${errors.join(" | ")}`);
}

// ---------- cleaning and checking ----------

const slugify = (s) =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 90);

function cleanBody(raw, validSlugs) {
	let body = raw.replace(/\r\n/g, "\n").trim();
	body = body.replace(/^#\s+.+\n+/, ""); // the page already renders the title
	body = body.split(/\n#{1,3}\s*Sources?\b/i)[0].trim(); // no invented sources
	const removed = [];
	// external links -> plain text; unknown internal links -> plain text
	body = body.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) => {
		const internal = url.match(/^\/blog\/([a-z0-9-]+)\/?$/);
		if (internal && validSlugs.has(internal[1])) return `[${text}](/blog/${internal[1]}/)`;
		removed.push(url);
		return text;
	});
	body = body.replace(/\bhttps?:\/\/\S+/g, "");
	return { body, removedLinks: removed };
}

const NUM = /₱\s?\d[\d,]*(?:\.\d+)?|\$\s?\d[\d,]*(?:\.\d+)?|\d+(?:\.\d+)?\s?%/g;
const norm = (s) => s.replace(/\s+/g, "");

function unverifiedNumbers(body, corpus) {
	const known = norm(corpus);
	const found = new Set((body.match(NUM) ?? []).map(norm));
	return [...found].filter((n) => !known.includes(n));
}

function phNow() {
	const d = new Date(Date.now() + 8 * 3600_000);
	return d.toISOString().slice(0, 19) + "+08:00";
}

function cut(s, max) {
	if (s.length <= max) return s;
	return s.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

// ---------- main ----------

if (!BRAND[CATEGORY]) fail(`CATEGORY must be one of: ${Object.keys(BRAND).join(", ")} (got "${CATEGORY}")`);

const existing = await loadExisting();
const slugs = new Set(existing.map((p) => p.slug));
const topics = JSON.parse(await fs.readFile(TOPICS_FILE, "utf8"));
const facts = JSON.parse(await fs.readFile(FACTS_FILE, "utf8"));

const topic = (topics[CATEGORY] ?? []).find((t) => !slugs.has(t.slug));
if (!topic) {
	console.warn(`::warning title=Auto guide::No topics left for "${CATEGORY}". Add more to automation/topics.json.`);
	log("nothing to write");
	process.exit(0);
}
log(`topic: ${topic.title} (${topic.slug})`);

const factsStr = factsText(facts);
const sources = pickSources(existing, topic);
const system = SYSTEM;
const user = buildUser({ topic, facts: factsStr, sources, existing });
log(`prompt size: about ${Math.round((system.length + user.length) / 4)} tokens`);
if (DRY) {
	log("dry run, stopping before the API call");
	process.exit(0);
}

const { data, provider, model } = await generate(system, user);
const { body: cleaned, removedLinks } = cleanBody(data.body, slugs);
const closing = `Last updated ${new Date().toLocaleDateString("en-US", { timeZone: "Asia/Manila", year: "numeric", month: "long", day: "numeric" })}. Fees, rates and limits can change at any time, so confirm them in the official app before you act.`;
const body = `${cleaned}\n\n${closing}\n`;

const corpus = [factsStr, sources, topic.title, topic.angle ?? ""].join("\n");
const unverified = unverifiedNumbers(cleaned, corpus);
const asDraft = unverified.length > 0;

const description = cut(String(data.description || topic.title).replace(/\s+/g, " ").trim(), 170);
const seoTitle = typeof data.seoTitle === "string" && data.seoTitle.length <= 65 ? data.seoTitle : "";
const tags = [BRAND[CATEGORY], ...(Array.isArray(data.tags) ? data.tags : [])]
	.map((t) => String(t).trim())
	.filter((t, i, arr) => t && arr.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i)
	.slice(0, 5);

const frontmatter = [
	"---",
	`title: ${JSON.stringify(String(data.title).trim())}`,
	seoTitle && `seoTitle: ${JSON.stringify(seoTitle)}`,
	`description: ${JSON.stringify(description)}`,
	`pubDate: ${JSON.stringify(phNow())}`,
	`tags: [${tags.map((t) => JSON.stringify(t)).join(", ")}]`,
	"aiGenerated: true",
	asDraft && "draft: true",
	"---",
]
	.filter(Boolean)
	.join("\n");

const dir = path.join(POSTS_DIR, CATEGORY);
await fs.mkdir(dir, { recursive: true });
const file = path.join(dir, `${topic.slug}.md`);
await fs.writeFile(file, `${frontmatter}\n\n${body}`, "utf8");

const report = [
	`**Topic:** ${topic.title}`,
	`**File:** \`src/posts/${CATEGORY}/${topic.slug}.md\``,
	`**Written by:** ${provider} (${model}), ${countWords(body)} words`,
	"",
	asDraft
		? `⚠️ **Saved as \`draft: true\`.** These numbers are not in your facts or source posts. Check each one, fix the post, then delete the \`draft: true\` line before merging:\n${unverified.map((n) => `- ${n}`).join("\n")}`
		: "✅ Every peso amount and percentage in the post was found in your facts or existing posts. Still skim it before merging.",
	removedLinks.length ? `\nLinks removed (not on the allowed list): ${removedLinks.map((l) => `\`${l}\``).join(", ")}` : "",
	"",
	"_AI-generated. The post shows the site's “AI-generated guide” badge._",
].join("\n");
await fs.writeFile(REPORT_FILE, report, "utf8");

if (process.env.GITHUB_OUTPUT) {
	await fs.appendFile(
		process.env.GITHUB_OUTPUT,
		`slug=${topic.slug}\ntitle=${String(data.title).replace(/[\r\n]+/g, " ")}\nstatus=${asDraft ? "draft" : "ready"}\n`,
	);
}
log(`saved ${path.relative(ROOT, file)} (${asDraft ? `DRAFT, ${unverified.length} unverified number(s)` : "ready"}) via ${provider}`);
