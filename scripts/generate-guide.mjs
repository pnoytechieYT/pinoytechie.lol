/**
 * Writes ONE new guide with AI and saves it as src/posts/<category>/<slug>.md
 *
 *   CATEGORY=maribank node scripts/generate-guide.mjs        (maribank | gcash | maya)
 *   node scripts/generate-guide.mjs gcash --dry              (shows the chosen topic and prompt size, no API call)
 *
 * How it works
 *   1. Takes the next topic of that category from automation/topics.json (your own list) and
 *      automation/topics-ai/<category>.json (topics the AI proposed). A topic is "done" when a file
 *      named <slug>.md already exists in src/posts. When the queue is EMPTY the AI proposes about 10
 *      new topics, which go into the same Pull Request as the guide, so you approve them there.
 *   2. Gives the AI your verified facts (automation/facts.json) plus your existing posts
 *      of that category as source material, and tells it NOT to invent numbers.
 *   3. Tries the providers in order (Gemini, GitHub Models, Groq, Mistral, DeepSeek). The first one with a key
 *      that answers wins. All three speak the same OpenAI-style API.
 *   4. Cleans the result, checks internal links, flags every peso amount / percentage
 *      that is NOT found in your facts or source posts, and writes the file.
 *      Any flagged number => the post is saved with `draft: true` so it can never go live unseen.
 *   5. SOURCES: the AI may only pick sources by id from automation/sources.json (official sites). The script writes the
 *      "Sources" section itself, so a URL can never be invented. No valid source => `draft: true`.
 *   6. SCHEDULE: every category has a weekly slot (automation/config.json: day + time, Philippine time). The guide gets
 *      that slot as its pubDate (usually tomorrow, so you can review it first). If the category already has a post on
 *      that date, nothing is written.
 *
 * Optional env: TOPIC="How to open a line on the Smart 5G Max WiFi" (your own topic for this run; empty = the next unwritten
 *               topic from the queue. The queue is not touched, so the queued topic is still written on a later run)
 *               TARGET_DATE=YYYY-MM-DD (the day to publish; the workflow sets it. Empty = next free weekly slot)
 *
 * Keys (GitHub: Settings > Secrets and variables > Actions). Use any one, or all for fallback:
 *   GEMINI_API_KEY, GROQ_API_KEY, MISTRAL_API_KEY, DEEPSEEK_API_KEY
 *   GitHub Models needs NO secret: the workflow passes its built-in GITHUB_TOKEN (permission `models: read`).
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
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS ?? 100_000);
const MIN_WORDS = Number(process.env.MIN_WORDS ?? 300); // hard minimum: below this the answer is rejected (your posts: min 228, median 490 words)
const SOFT_MIN_WORDS = Number(process.env.SOFT_MIN_WORDS ?? 500); // below this the AI is asked once for a fuller version
// Which categories exist and what they are about: automation/config.json
const CONFIG = JSON.parse(await fs.readFile(path.join(ROOT, "automation", "config.json"), "utf8"));
const CFG = CONFIG[CATEGORY];
const LABEL = CFG?.label ?? CATEGORY;
const GROUP_LABEL = { banks: "Banks and e-wallets", providers: "Internet providers" };
const SOURCES_FILE = path.join(ROOT, "automation", "sources.json");
const TARGET_DATE = (process.env.TARGET_DATE || "").trim();
const CUSTOM_TOPIC = (process.env.TOPIC || "").replace(/\s+/g, " ").trim(); // typed in the "Run workflow" form

// ---------- Philippine time helpers (UTC+8, no daylight saving) ----------
const PH_MS = 8 * 3600_000;
const phDay = (ms) => new Date(ms + PH_MS).toISOString().slice(0, 10); // 2026-11-27
const phWeekday = (day) => ((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7) + 1; // 1=Mon .. 7=Sun
const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const slotIso = (day, time) => `${day}T${time}:00+08:00`;
const prettyDay = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" });

/** Reads a frontmatter date the way the site does: quoted ISO, date only, or no offset (= Philippine time). */
function parseMs(value) {
	let raw = String(value ?? "").trim().replace(" ", "T");
	if (!raw) return null;
	if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) raw += "T00:00:00";
	if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(raw)) raw += "+08:00";
	const ms = Date.parse(raw);
	return Number.isNaN(ms) ? null : ms;
}

const PROVIDERS = {
	gemini: {
		maxTokens: 8000,
		base: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai",
		key: process.env.GEMINI_API_KEY,
		models: (process.env.GEMINI_MODEL || "gemini-flash-lite-latest,gemini-flash-latest").split(","),
	},
	// GitHub Models: free with the workflow's own GITHUB_TOKEN (needs `models: read`), no sign-up.
	github: {
		maxTokens: 3500, // the free tier caps output per request
		headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
		base: process.env.GITHUB_MODELS_BASE_URL || "https://models.github.ai/inference",
		key: process.env.GITHUB_MODELS_TOKEN || process.env.GITHUB_TOKEN,
		models: (process.env.GITHUB_MODELS_MODEL || "openai/gpt-4.1-mini,openai/gpt-4.1").split(","),
	},
	groq: {
		maxTokens: 8000,
		base: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
		key: process.env.GROQ_API_KEY,
		models: (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").split(","),
	},
	mistral: {
		maxTokens: 8000,
		base: process.env.MISTRAL_BASE_URL || "https://api.mistral.ai/v1",
		key: process.env.MISTRAL_API_KEY,
		models: (process.env.MISTRAL_MODEL || "mistral-small-latest").split(","),
	},
	deepseek: {
		maxTokens: 8000,
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
			pubMs: parseMs(fmField(fm, "pubDate")),
			draft: /^draft:\s*true\s*$/m.test(fm),
			body,
		});
	}
	return posts;
}

// A heading that is exactly "Sources" / "References". (Not "Sources of funds": that is a normal section.)
const SOURCES_HEADING = /\n#{1,3}[ \t]*(?:Sources?|References?)[ \t]*:?[ \t]*(?:\r?\n|$)/i;
const withoutSources = (text) => text.split(SOURCES_HEADING)[0].trim();

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
			const clean = withoutSources(p.body).slice(0, 3000);
			return `### ${p.title}\n${clean}`;
		})
		.join("\n\n");
}

function factsText(facts) {
	const block = (label, items) => (items?.length ? `${label}:\n${items.map((f) => `- ${f}`).join("\n")}` : "");
	return [block("General", facts.global), block(GROUP_LABEL[CFG.group], facts[CFG.group]), block(LABEL, facts[CATEGORY])]
		.filter(Boolean)
		.join("\n\n");
}

// ---------- prompt ----------

const SYSTEM = `You write guides for Pinoy Techie, an independent Philippine website that explains Philippine banks, e-wallets and internet providers in plain language.

VOICE: clear, calm, helpful English for Filipino readers. Short paragraphs. Say "you". No hype, no "best ever", no promises of returns, no financial advice.

STRUCTURE (Markdown, no H1 because the page title is added separately):
- Open with 2 to 4 sentences that answer the question straight away.
- Then 4 to 7 sections with "##" headings. Use "###" sparingly. Use bullet lists, numbered steps and one Markdown table when it helps.
- You may add callouts in exactly this form: "> [!NOTE] Short title" or "> [!WARNING] Short title" on one line, then "> text" on the next line.
- End with a short "##" section that helps the reader decide (who it suits, what to check first).
- 600 to 1,000 words in total.

HARD RULES (follow them even if the topic seems to need otherwise):
1. NUMBERS: never write a peso amount, percentage, interest rate, fee, limit, plan name, price, data allowance, speed, validity period, date or deadline unless it appears word for word in FACTS or SOURCE POSTS. If you need one that is missing, tell the reader to check the figure in the official app instead. Never estimate or round.
2. CLAIMS: when you state something a company says, say "According to <company>" and only if it is in FACTS or SOURCE POSTS.
3. LINKS: no external links, no URLs, no phone numbers, no email addresses, no USSD or short codes (like *123#). Internal links are allowed only from the EXISTING GUIDES list, written as [anchor text](/blog/slug/).
4. Do not write a "Sources" section, a date line, or any note about being an AI (the site adds the sources itself). Do not invent screens, menu names or steps you are not sure about; describe the general flow and say menus can differ by app version.
5. No fake quotes, no fake reviews, no invented statistics.
6. SOURCES: base the guide only on FACTS, SOURCE POSTS and what official sources publish. Never rely on blogs, forums, social media, news rumours or "people say". In "sources", list the ids (from OFFICIAL SOURCES) of the pages a reader should open to confirm the guide: the company that is the subject, plus the regulator (BSP, PDIC, BIR, NTC, DICT) when the guide touches rules, deposit insurance, tax or telecom regulation. Use 1 to 4 ids, copied exactly from the list. If nothing in the list fits, return an empty list. Never write a URL yourself.

OUTPUT: only a JSON object, no code fences, with these keys:
{"title": "...", "seoTitle": "50-60 characters", "description": "140-160 characters", "tags": ["3 to 5 short tags"], "sources": ["id", "id"], "body": "the Markdown article"}`;

function groupRules() {
	const rules = [];
	if (CFG.group === "banks") {
		rules.push("TOPIC TYPE: a bank or e-wallet guide. Explain at a high level. Keep e-money wallets and bank deposits apart: PDIC coverage applies to bank deposits only, and only as stated in FACTS.");
	} else {
		rules.push("TOPIC TYPE: a mobile or internet provider guide. Plans, promos, prices, speeds and coverage change often and differ by location, so give the reader a checklist and tell them how to verify instead of giving figures. Never say a network is faster, better or has wider coverage than another.");
	}
	if (CFG.more) rules.push("This category covers other providers: the guide must be about the one named provider in the topic title (or the general question in it). Do not compare providers on numbers.");
	return `\n\nCATEGORY RULES:\n${rules.join("\n")}`;
}

function buildUser({ topic, facts, sources, style, linkable, official }) {
	const guides = linkable.map((p) => `- ${p.slug}: ${p.title}`).join("\n");
	const officialList = official.map((s) => `- ${s.id}: ${s.label}`).join("\n");
	return `CATEGORY: ${LABEL} (${CFG.what})
TOPIC: ${topic.title}
ANGLE: ${topic.angle ?? "Answer the reader's main question first, then explain the details."}

FACTS (verified by the site owner; the only numbers you may use besides the SOURCE POSTS):
${facts || "(none yet)"}

SOURCE POSTS (already published on the site, treat as verified; match their tone):
${sources || "(none)"}

${style ? `STYLE EXAMPLE (from another category: copy the tone and structure only, never its facts or numbers):\n${style}\n\n` : ""}EXISTING GUIDES you may link to:
${guides}

OFFICIAL SOURCES (pick ids for the "sources" key; these are the only sources allowed):
${officialList || "(none)"}

Write the guide now. Return only the JSON object.`;
}

// ---------- calling the AI ----------

async function post(url, init) {
	let target = url;
	for (let hop = 0; hop < 4; hop++) {
		const res = await fetch(target, { ...init, redirect: "manual" });
		const location = res.headers.get("location");
		if (res.status >= 300 && res.status < 400 && location) {
			const next = new URL(location, target);
			if (next.origin !== new URL(url).origin) throw new Error(`redirected to another host (${next.host}), not following`);
			target = next.href;
			continue;
		}
		res.finalUrl = target;
		return res;
	}
	throw new Error("too many redirects");
}

async function chat(p, model, system, user) {
	const body = {
		model,
		temperature: 0.4,
		max_tokens: p.maxTokens ?? 8000,
		response_format: { type: "json_object" },
		messages: [
			{ role: "system", content: system },
			{ role: "user", content: user },
		],
	};
	for (let attempt = 1; attempt <= 3; attempt++) {
		let res;
		try {
			res = await post(`${p.base}/chat/completions`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${p.key}`, ...(p.headers ?? {}) },
				body: JSON.stringify(body),
				signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
			});
		} catch (e) {
			// A model that hangs will not recover in seconds: skip to the next one instead of waiting again.
			if (e.name === "TimeoutError") throw new Error(`no answer within ${Math.round(REQUEST_TIMEOUT_MS / 1000)} seconds`);
			if (attempt < 2 && !/redirect/i.test(e.message)) {
				await sleep(RETRY_MS);
				continue;
			}
			throw new Error(`network error (${e.cause?.code ?? e.message})`);
		}
		if (res.ok) {
			const raw = await res.text();
			let data;
			try {
				data = JSON.parse(raw);
			} catch {
				throw new Error(`HTTP ${res.status} but the answer is not JSON (url ${res.finalUrl}, content-type ${res.headers.get("content-type")}, request-id ${res.headers.get("x-github-request-id") ?? res.headers.get("x-request-id") ?? "none"}): ${raw.replace(/\s+/g, " ").slice(0, 200)}`);
			}
			const text = data.choices?.[0]?.message?.content;
			if (!text) throw new Error(`empty answer: ${raw.replace(/\s+/g, " ").slice(0, 200)}`);
			return text;
		}
		const detail = (await res.text()).replace(/\s+/g, " ").slice(0, 250);
		if (res.status === 400 && body.response_format) {
			delete body.response_format; // some models reject JSON mode; the prompt already asks for JSON
			continue;
		}
		if (((res.status === 429 && attempt < 2) || (res.status >= 500 && attempt < 3))) {
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

async function generate(system, user, validate, { expand = false } = {}) {
	const order = (process.env.AI_PROVIDERS || "gemini,github,groq,mistral,deepseek")
		.split(",")
		.map((s) => s.trim().toLowerCase())
		.filter((n) => PROVIDERS[n]?.key);
	if (!order.length) fail("No AI key found. Add GEMINI_API_KEY (or GROQ/MISTRAL/DEEPSEEK) as a repository secret, or give the workflow `models: read`.");

	const errors = [];
	for (const name of order) {
		const p = PROVIDERS[name];
		for (const model of p.models.map((m) => m.trim()).filter(Boolean)) {
			try {
				log(`asking ${name} (${model})`);
				let data = parseJson(await chat(p, model, system, user));
				const wordsOf = (d) => (typeof d?.body === "string" ? countWords(d.body) : 0);
				if (expand && wordsOf(data) > 0 && wordsOf(data) < SOFT_MIN_WORDS) {
					log(`${name}/${model} wrote only ${wordsOf(data)} words, asking once for a fuller guide`);
					const nudge = `${user}\n\nIMPORTANT: your previous attempt had only ${wordsOf(data)} words. Write a fuller guide of at least 650 words: more detail in each section, a checklist, common mistakes and what to check first. Do NOT add any price, number, code or contact detail that is not in FACTS or SOURCE POSTS. Return only the JSON object.`;
					try {
						const again = parseJson(await chat(p, model, system, nudge));
						if (wordsOf(again) > wordsOf(data)) data = again;
					} catch (e) {
						log(`${name}/${model} second try failed (${e.message}), keeping the first answer`);
					}
				}
				const value = validate(data);
				return { value, provider: name, model };
			} catch (e) {
				log(`${name}/${model} failed: ${e.message}`);
				errors.push(`${name}/${model}: ${e.message}`);
			}
		}
	}
	fail(`Every provider failed. ${errors.join(" | ")}`);
}

function validateArticle(data) {
	if (typeof data.title !== "string" || typeof data.body !== "string") throw new Error("JSON is missing title or body");
	if (countWords(data.body) < MIN_WORDS) throw new Error(`article too short (${countWords(data.body)} words, minimum ${MIN_WORDS})`);
	return data;
}

// ---------- AI topic ideas (used only when the queue is empty) ----------

const TOPIC_SYSTEM = `You plan the editorial calendar for Pinoy Techie, an independent Philippine website with plain-language guides about Philippine banks, e-wallets and internet providers.
Propose NEW guide topics for ONE category. Each must answer a real question a Filipino reader would search for: how-to, fees explained, safety, comparisons, troubleshooting, beginner explainers.

RULES:
1. Never repeat or closely rephrase a title listed under ALREADY PUBLISHED or ALREADY QUEUED.
2. Prefer evergreen topics. Avoid topics that depend on exact current rates, promos or fees that are not in FACTS.
3. No hype, no "best ever", no promo codes, no get-rich-quick angles, and nothing that teaches how to commit fraud.
4. title: natural English, under 70 characters. slug: lowercase-with-hyphens, under 70 characters, unique.
5. angle: ONE sentence telling the writer what to cover and what NOT to invent (for example fees, menu names or contact details).

OUTPUT: only JSON, no code fences: {"topics":[{"slug":"...","title":"...","angle":"..."}]} with 10 topics.`;

const jaccard = (a, b) => {
	const A = words(a);
	const B = words(b);
	let inter = 0;
	for (const w of A) if (B.has(w)) inter++;
	return A.size + B.size - inter === 0 ? 0 : inter / (A.size + B.size - inter);
};

function makeTopicValidator(takenSlugs, knownTitles) {
	return (data) => {
		const list = Array.isArray(data?.topics) ? data.topics : [];
		const out = [];
		const titles = [...knownTitles];
		const seen = new Set(takenSlugs);
		for (const t of list) {
			const slug = String(t?.slug ?? "").trim().toLowerCase();
			const title = String(t?.title ?? "").replace(/\s+/g, " ").trim();
			const angle = String(t?.angle ?? "").replace(/\s+/g, " ").trim();
			if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 80) continue;
			if (!title || title.length > 100 || !angle || seen.has(slug)) continue;
			if (titles.some((x) => jaccard(x, title) >= 0.6)) continue; // too close to something we already have
			seen.add(slug);
			titles.push(title);
			out.push({ slug, title, angle });
			if (out.length === 10) break;
		}
		if (out.length < 3) throw new Error(`only ${out.length} usable new topics`);
		return out;
	};
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
	body = withoutSources(body); // the site writes the Sources section itself, from automation/sources.json
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

const NUM = /(?:₱|PHP\s?|PhP\s?)\s?\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?\s?(?:pesos?)\b|\$\s?\d[\d,]*(?:\.\d+)?|\d+(?:\.\d+)?\s?%|\d+(?:\.\d+)?\s?(?:Mbps|Gbps|GB|MB|TB)\b|\*\d{2,4}(?:\*[\d*]+)?#/gi;
const norm = (s) => s.replace(/\s+/g, "").replace(/[.,]+$/, "").toLowerCase();

// Compares whole numbers, not pieces of text: "₱1,000" must NOT pass just because "₱1,000,000" is in the facts,
// and "5%" must not pass because "15%" is.
function unverifiedNumbers(body, corpus) {
	const known = new Set((corpus.match(NUM) ?? []).map(norm));
	const found = new Set((body.match(NUM) ?? []).map(norm));
	return [...found].filter((n) => !known.has(n));
}

function cut(s, max) {
	if (s.length <= max) return s;
	return s.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

// ---------- main ----------

if (!CFG) fail(`CATEGORY must be one of: ${Object.keys(CONFIG).join(", ")} (got "${CATEGORY}")`);

const existing = await loadExisting();
const slugs = new Set(existing.map((p) => p.slug));
const topics = JSON.parse(await fs.readFile(TOPICS_FILE, "utf8"));
const facts = JSON.parse(await fs.readFile(FACTS_FILE, "utf8"));

const AI_TOPICS_FILE = path.join(ROOT, "automation", "topics-ai", `${CATEGORY}.json`);
const aiTopics = await fs.readFile(AI_TOPICS_FILE, "utf8").then(JSON.parse, () => []);
const queue = [...(topics[CATEGORY] ?? []), ...aiTopics];
const factsStr = factsText(facts);
const registry = JSON.parse(await fs.readFile(SOURCES_FILE, "utf8")).sources ?? [];
const official = registry.filter((x) => x.appliesTo?.some((a) => a === "all" || a === CATEGORY || a === CFG.group));

// ---------- which day does this guide publish on? ----------
// One guide per category per day. Drafts and scheduled posts count too, so a day can never get two guides.
const takenDays = new Set(existing.filter((p) => p.category === CATEGORY && p.pubMs != null).map((p) => phDay(p.pubMs)));
const slotTime = /^\d{2}:\d{2}$/.test(CFG.time ?? "") ? CFG.time : "12:00";
let slotDay = TARGET_DATE;
if (slotDay && !/^\d{4}-\d{2}-\d{2}$/.test(slotDay)) fail(`TARGET_DATE must look like 2026-11-30 (got "${slotDay}")`);
if (slotDay) {
	if (takenDays.has(slotDay)) {
		const msg = `${LABEL} already has a guide dated ${slotDay}. Nothing was written, so that day keeps one guide.`;
		console.log(`::notice title=Auto guide::${msg}`);
		log(msg);
		if (process.env.GITHUB_OUTPUT) await fs.appendFile(process.env.GITHUB_OUTPUT, "skipped=true\n");
		process.exit(0);
	}
} else {
	// No date given (manual run): the next weekly slot of this category that is still in the future and still free.
	const today = phDay(Date.now());
	for (let i = 0; i < 120 && !slotDay; i++) {
		const d = addDays(today, i);
		if (CFG.day && phWeekday(d) !== CFG.day) continue;
		if (takenDays.has(d) || Date.parse(slotIso(d, slotTime)) <= Date.now()) continue;
		slotDay = d;
	}
	if (!slotDay) fail(`No free slot found for ${LABEL} in the next 120 days.`);
}
const pubDate = slotIso(slotDay, slotTime);
log(`publish slot: ${pubDate}`);
// Only link to guides that will be live (not drafts) by the time this one is.
const linkable = existing.filter((p) => !p.draft && (p.pubMs ?? 0) <= Date.parse(pubDate));
const linkableSlugs = new Set(linkable.map((p) => p.slug));

let topic;
let topicNote = "";
if (CUSTOM_TOPIC) {
	if (CUSTOM_TOPIC.length < 8 || CUSTOM_TOPIC.length > 200) fail(`The topic must be 8 to 200 characters (got ${CUSTOM_TOPIC.length}). Describe the guide in one sentence.`);
	const base = slugify(CUSTOM_TOPIC).slice(0, 70).replace(/-+$/, "");
	if (!base) fail("The topic needs some letters or numbers.");
	let slug = base;
	for (let n = 2; slugs.has(slug); n++) slug = `${base}-${n}`;
	topic = {
		slug,
		title: CUSTOM_TOPIC,
		angle: `The site owner asked for exactly this topic: "${CUSTOM_TOPIC}". The wording may be informal or have typos, so write a clean, natural English title that keeps the meaning. Cover what a reader needs to know, but use only numbers and product details found in FACTS or SOURCE POSTS. For anything else (plans, prices, speeds, app steps, what a product includes) tell the reader to check the official app or website. Do not guess what the product includes or how its menus look.`,
	};
	const twins = existing.filter((p) => p.category === CATEGORY && jaccard(p.title, CUSTOM_TOPIC) >= 0.5).map((p) => p.title);
	topicNote = `**Topic:** typed by you in the Run workflow form: “${CUSTOM_TOPIC}”.${twins.length ? `\n⚠️ Similar guide(s) already exist: ${twins.map((t) => `“${t}”`).join(", ")}. Check this one adds something new.` : ""}`;
	log(`custom topic: ${CUSTOM_TOPIC}`);
} else {
	topic = queue.find((t) => !slugs.has(t.slug));
}
let newTopics = [];
let topicProvider = "";
if (!topic) {
	log(`no topics left for ${CATEGORY}, asking the AI for new topic ideas`);
	if (DRY) {
		log("dry run: would ask the AI for new topic ideas, then stop");
		process.exit(0);
	}
	const published = existing.filter((p) => p.category === CATEGORY).map((p) => `- ${p.title}`).join("\n");
	const queued = queue.map((t) => `- ${t.title}`).join("\n");
	const ask = `CATEGORY: ${LABEL} (${CFG.what})

FACTS (what we can write about with confidence):
${factsStr || "(none yet)"}

ALREADY PUBLISHED in this category:
${published || "(none)"}

ALREADY QUEUED (including finished ones):
${queued || "(none)"}

Propose 10 new topics now. Return only the JSON object.`;
	const known = [...existing.filter((p) => p.category === CATEGORY).map((p) => p.title), ...queue.map((t) => t.title)];
	const taken = [...slugs, ...queue.map((t) => t.slug)];
	const res = await generate(TOPIC_SYSTEM, ask, makeTopicValidator(taken, known));
	newTopics = res.value;
	topicProvider = `${res.provider} (${res.model})`;
	await fs.mkdir(path.dirname(AI_TOPICS_FILE), { recursive: true });
	const all = [...aiTopics, ...newTopics];
	await fs.writeFile(AI_TOPICS_FILE, `[\n${all.map((t) => "  " + JSON.stringify(t)).join(",\n")}\n]\n`, "utf8");
	log(`added ${newTopics.length} new topic ideas to automation/topics-ai/${CATEGORY}.json`);
	topic = newTopics[0];
}
log(`topic: ${topic.title} (${topic.slug})`);

const sources = pickSources(existing, topic);
const system = SYSTEM + groupRules();
// A brand-new category has no source posts yet: show one post from elsewhere as a style reference only.
const style = sources ? "" : withoutSources(existing.find((p) => p.category !== CATEGORY)?.body ?? "").slice(0, 1800);
const user = buildUser({ topic, facts: factsStr, sources, style, linkable, official });
log(`prompt size: about ${Math.round((system.length + user.length) / 4)} tokens`);
if (DRY) {
	log("dry run, stopping before the API call");
	process.exit(0);
}

const { value: data, provider, model } = await generate(system, user, validateArticle, { expand: true });
// A typed topic may have typos, so the web address comes from the clean title the AI wrote, not from your wording.
if (CUSTOM_TOPIC) {
	const base = slugify(String(data.title)).slice(0, 70).replace(/-+$/, "") || topic.slug;
	let slug = base;
	for (let i = 2; slugs.has(slug); i++) slug = `${base}-${i}`;
	topic.slug = slug;
}
const { body: cleaned, removedLinks } = cleanBody(data.body, linkableSlugs);

// Sources: only ids from automation/sources.json count. The script writes the section, the AI never writes a URL.
const askedIds = [...new Set((Array.isArray(data.sources) ? data.sources : []).map((x) => String(x).trim().toLowerCase()).filter(Boolean))];
const picked = askedIds.map((id) => official.find((x) => x.id === id)).filter(Boolean).slice(0, 4);
const unknownIds = askedIds.filter((id) => !official.some((x) => x.id === id));
const sourceStatus = await Promise.all(
	picked.map(async (x) => {
		try {
			const res = await fetch(x.url, { redirect: "follow", signal: AbortSignal.timeout(12_000), headers: { "User-Agent": "Mozilla/5.0 (compatible; PinoyTechieLinkCheck/1.0)" } });
			return { ...x, ok: res.ok, status: res.status };
		} catch (e) {
			return { ...x, ok: false, status: e.name === "TimeoutError" ? "timeout" : "network error" };
		}
	}),
);
const sourcesMd = picked.length ? `## Sources\n\n${picked.map((x) => `- [${x.label}](${x.url})`).join("\n")}` : "";
const closing = `Last updated ${prettyDay(slotDay)}. Fees, rates and limits can change at any time, so confirm them in the official app or on the official website before you act.`;
const body = `${cleaned}\n\n${sourcesMd ? `${sourcesMd}\n\n` : ""}${closing}\n`;

const corpus = [factsStr, sources, topic.title, topic.angle ?? ""].join("\n");
const unverified = unverifiedNumbers(cleaned, corpus);
const noSources = picked.length === 0;
const asDraft = unverified.length > 0 || noSources;
const factsAgeDays = facts.asOf && parseMs(facts.asOf) ? Math.floor((Date.now() - parseMs(facts.asOf)) / 86_400_000) : null;

const description = cut(String(data.description || topic.title).replace(/\s+/g, " ").trim(), 170);
const seoTitle = typeof data.seoTitle === "string" && data.seoTitle.length <= 65 ? data.seoTitle : "";
const tags = [...(CFG.more ? [] : [LABEL]), ...(Array.isArray(data.tags) ? data.tags : [])]
	.map((t) => String(t).trim())
	.filter((t, i, arr) => t && arr.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i)
	.slice(0, 5);

const frontmatter = [
	"---",
	`title: ${JSON.stringify(String(data.title).trim())}`,
	seoTitle && `seoTitle: ${JSON.stringify(seoTitle)}`,
	`description: ${JSON.stringify(description)}`,
	`pubDate: ${JSON.stringify(pubDate)}`,
	`tags: [${tags.map((t) => JSON.stringify(t)).join(", ")}]`,
	"aiGenerated: true",
	/^[\w-]{11}$/.test(topic.video ?? "") && `video: ${JSON.stringify(topic.video)}`,
	asDraft && "draft: true",
	"---",
]
	.filter(Boolean)
	.join("\n");

const dir = path.join(POSTS_DIR, CATEGORY);
await fs.mkdir(dir, { recursive: true });
const file = path.join(dir, `${topic.slug}.md`);
await fs.writeFile(file, `${frontmatter}\n\n${body}`, "utf8");

// The workflow commits src/posts AND automation/topics-ai, and git stops with "pathspec did not match any files"
// when a listed folder does not exist yet (it only exists after the AI first proposes topics). Make sure it does.
// The empty .gitkeep also keeps the folder in the repository.
const keepFile = path.join(ROOT, "automation", "topics-ai", ".gitkeep");
await fs.mkdir(path.dirname(keepFile), { recursive: true });
await fs.access(keepFile).catch(() => fs.writeFile(keepFile, ""));

const report = [
	topicNote || `**Topic:** ${topic.title}`,
	`**File:** \`src/posts/${CATEGORY}/${topic.slug}.md\``,
	`**Written by:** ${provider} (${model}), ${countWords(body)} words`,
	`**Goes live:** ${prettyDay(slotDay)}, ${slotTime} Philippine time (\`pubDate\` ${pubDate}). Merge before then and it appears at that time; merge later and it appears right away.`,
	"",
	asDraft
		? `⚠️ **Saved as \`draft: true\`.** Fix the points below, then delete the \`draft: true\` line before merging:${unverified.length ? `\n\nThese numbers are not in your facts or source posts:\n${unverified.map((n) => `- ${n}`).join("\n")}` : ""}${noSources ? "\n\nNo valid official source was chosen. Add a source from `automation/sources.json` under a `## Sources` heading." : ""}`
		: "✅ Every peso amount and percentage in the post was found in your facts or existing posts. Still skim it before merging.",
	picked.length ? `\n**Sources used:**\n${sourceStatus.map((x) => `- ${x.ok ? "✅" : "⚠️"} ${x.label} (${x.ok ? "opens" : `could not open: ${x.status}; some official sites block bots, so open it yourself`})`).join("\n")}` : "",
	unknownIds.length ? `\nSource ids ignored (not in \`automation/sources.json\`): ${unknownIds.map((x) => `\`${x}\``).join(", ")}` : "",
	factsAgeDays !== null && factsAgeDays > 30 ? `\n⚠️ \`automation/facts.json\` was last checked ${factsAgeDays} days ago. Update it so the AI works from current numbers.` : "",
	removedLinks.length ? `\nLinks removed (not on the allowed list): ${removedLinks.map((l) => `\`${l}\``).join(", ")}` : "",
	newTopics.length
		? `\n### New topic ideas (${newTopics.length})\nThe queue was empty, so ${topicProvider} proposed these. They are saved in \`automation/topics-ai/${CATEGORY}.json\`. Edit that file in this PR to remove any you don't want, or just merge to approve them all.\n${newTopics.map((t, i) => `${i + 1}. ${t.title}${i === 0 ? " **(written in this PR)**" : ""}`).join("\n")}`
		: "",
	"",
	"_AI-generated. The post shows “By Pinoy Techie via AI” under the title and its official sources at the end._",
].join("\n");
await fs.writeFile(REPORT_FILE, report, "utf8");

if (process.env.GITHUB_OUTPUT) {
	await fs.appendFile(
		process.env.GITHUB_OUTPUT,
		`slug=${topic.slug}\ntitle=${String(data.title).replace(/[\r\n]+/g, " ")}\nstatus=${asDraft ? "draft" : "ready"}\npubdate=${slotDay}\n`,
	);
}
log(`saved ${path.relative(ROOT, file)} (${asDraft ? `DRAFT, ${unverified.length} unverified number(s)` : "ready"}) via ${provider}`);
