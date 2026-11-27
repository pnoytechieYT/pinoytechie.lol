#!/usr/bin/env node
/**
 * Tells Bing, DuckDuckGo (through Bing), Yandex, Naver and Seznam about new and changed pages (IndexNow).
 * Google does NOT use IndexNow: for Google, keep the sitemap submitted in Search Console.
 *
 * Runs after every deploy (.github/workflows/indexnow.yml):
 *   1. reads the LIVE sitemap, with each page's <lastmod>
 *   2. compares it with the list of pages it already sent (.indexnow-state.json, kept in the Actions cache)
 *   3. sends only the new or changed pages, so an ordinary 30-minute rebuild sends nothing
 *
 * The key is the name of the file in /public that looks like <32 hex characters>.txt (its content is the same key).
 * IndexNow checks that file on your live site, so it has to be deployed before the first submission.
 *
 * Environment (all optional): SITE_URL, INDEXNOW_ENDPOINT, STATE_FILE, DRY_RUN=1
 */
import fs from "node:fs/promises";
import path from "node:path";

const SITE = (process.env.SITE_URL || "https://pinoytechie.lol").replace(/\/$/, "");
const ENDPOINT = process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow";
const STATE_FILE = process.env.STATE_FILE || ".indexnow-state.json";
const DRY = process.env.DRY_RUN === "1";
const log = (m) => console.log(`[indexnow] ${m}`);
const fail = (m) => {
	console.error(`::error title=IndexNow::${m}`);
	process.exit(1);
};

async function findKey() {
	for (const file of await fs.readdir("public")) {
		const m = file.match(/^([a-f0-9]{32})\.txt$/);
		if (m && (await fs.readFile(path.join("public", file), "utf8")).trim() === m[1]) return m[1];
	}
	return null;
}

async function get(url) {
	const res = await fetch(url, { headers: { "User-Agent": "pinoytechie-indexnow/1.0" }, signal: AbortSignal.timeout(30_000) });
	if (!res.ok) throw new Error(`${url} answered HTTP ${res.status}`);
	return res.text();
}

const tag = (xml, name) => [...xml.matchAll(new RegExp(`<${name}>\\s*([^<]*?)\\s*</${name}>`, "g"))].map((m) => m[1]);

async function liveUrls() {
	const index = await get(`${SITE}/sitemap-index.xml`);
	const maps = tag(index, "loc");
	if (!maps.length) throw new Error("sitemap-index.xml lists no sitemaps");
	const pages = new Map();
	for (const map of maps) {
		const xml = await get(map);
		for (const block of xml.match(/<url>[\s\S]*?<\/url>/g) ?? []) {
			const loc = tag(block, "loc")[0];
			if (loc) pages.set(loc, tag(block, "lastmod")[0] ?? "");
		}
	}
	return pages;
}

const key = await findKey();
if (!key) fail("No key file found. Add public/<32 hex characters>.txt whose content is the same 32 characters.");

let state = {};
try {
	state = JSON.parse(await fs.readFile(STATE_FILE, "utf8"));
} catch {
	log("no earlier list found: this is the first run, every page will be sent once");
}

let pages;
try {
	pages = await liveUrls();
} catch (e) {
	fail(`Could not read the live sitemap: ${e.message}`);
}

const changed = [...pages].filter(([url, lastmod]) => state[url] !== lastmod).map(([url]) => url);
log(`${pages.size} pages in the sitemap, ${changed.length} new or changed`);
if (!changed.length) process.exit(0);
if (DRY) {
	changed.forEach((u) => log(`would send ${u}`));
	process.exit(0);
}

const host = new URL(SITE).host;
for (let i = 0; i < changed.length; i += 10_000) {
	const batch = changed.slice(i, i + 10_000);
	const res = await fetch(ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json; charset=utf-8" },
		body: JSON.stringify({ host, key, keyLocation: `${SITE}/${key}.txt`, urlList: batch }),
		signal: AbortSignal.timeout(30_000),
	});
	if (res.status !== 200 && res.status !== 202) {
		const detail = (await res.text()).slice(0, 200);
		await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 1)); // keep what was already sent
		fail(`IndexNow answered HTTP ${res.status} ${detail}. 403 or 422 usually means the key file is not live yet: deploy first, then re-run.`);
	}
	for (const url of batch) state[url] = pages.get(url);
	log(`sent ${batch.length} pages (HTTP ${res.status})`);
}
// Forget pages that left the sitemap, so the file does not grow forever
for (const url of Object.keys(state)) if (!pages.has(url)) delete state[url];
await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 1));
