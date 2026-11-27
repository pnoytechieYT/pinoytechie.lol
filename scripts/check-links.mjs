#!/usr/bin/env node
/**
 * Checks the BUILT site (dist/) for broken links.
 *
 *   node scripts/check-links.mjs                 internal links and #anchors. Exit 1 if any are broken.
 *   node scripts/check-links.mjs --report f.md   also writes a short Markdown summary (used for pull request descriptions)
 *   node scripts/check-links.mjs --external      ALSO checks links to other websites (slower; blocked sites are not counted as broken)
 *
 * Run `npm run build` first. This protects you from AI-written guides that link to a page that does not exist.
 */
import fs from "node:fs/promises";
import path from "node:path";

const DIST = "dist";
const SITE_HOST = "pinoytechie.lol";
const args = process.argv.slice(2);
const EXTERNAL = args.includes("--external");
const reportFile = args.includes("--report") ? args[args.indexOf("--report") + 1] : null;

async function walk(dir) {
	const out = [];
	for (const e of await fs.readdir(dir, { withFileTypes: true })) {
		const full = path.join(dir, e.name);
		if (e.isDirectory()) out.push(...(await walk(full)));
		else out.push(full);
	}
	return out;
}

const exists = async (p) => !!(await fs.stat(p).catch(() => null));

/** "/blog/x/" -> dist/blog/x/index.html, "/rss.xml" -> dist/rss.xml */
async function resolveTarget(urlPath) {
	const clean = decodeURIComponent(urlPath.replace(/^\//, ""));
	const candidates = [path.join(DIST, clean), path.join(DIST, clean, "index.html"), path.join(DIST, `${clean}.html`)];
	for (const c of candidates) {
		const st = await fs.stat(c).catch(() => null);
		if (st?.isFile()) return c;
	}
	return null;
}

if (!(await exists(DIST))) {
	console.error("No dist/ folder. Run `npm run build` first.");
	process.exit(1);
}

const files = await walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith(".html"));
const idCache = new Map();
async function idsOf(file) {
	if (!idCache.has(file)) {
		const html = await fs.readFile(file, "utf8");
		idCache.set(file, new Set([...html.matchAll(/\s(?:id|name)="([^"]+)"/g)].map((m) => m[1])));
	}
	return idCache.get(file);
}

const broken = [];
const external = new Map(); // url -> pages that use it
let checked = 0;

for (const file of htmlFiles) {
	const page = "/" + path.relative(DIST, file).replace(/index\.html$/, "").replace(/\\/g, "/");
	const html = await fs.readFile(file, "utf8");
	const links = [...html.matchAll(/<(?:a|img|source)\b[^>]*?\s(?:href|src)="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
	for (const raw of new Set(links)) {
		if (!raw || /^(mailto:|tel:|javascript:|data:|sms:|viber:)/i.test(raw)) continue;
		let url;
		try {
			url = new URL(raw, `https://${SITE_HOST}${page}`);
		} catch {
			broken.push({ page, link: raw, why: "not a valid URL" });
			continue;
		}
		if (url.host !== SITE_HOST) {
			if (EXTERNAL && /^https?:$/.test(url.protocol)) {
				const key = url.href.split("#")[0];
				if (!external.has(key)) external.set(key, new Set());
				external.get(key).add(page);
			}
			continue;
		}
		checked++;
		const target = await resolveTarget(url.pathname);
		if (!target) {
			broken.push({ page, link: raw, why: "page or file not found" });
			continue;
		}
		if (url.hash && target.endsWith(".html")) {
			const id = decodeURIComponent(url.hash.slice(1));
			if (id && !(await idsOf(target)).has(id)) broken.push({ page, link: raw, why: `anchor #${id} not found on the target page` });
		}
	}
}

let externalBroken = [];
if (EXTERNAL) {
	const urls = [...external.keys()];
	console.log(`Checking ${urls.length} external links (this can take a minute)...`);
	let i = 0;
	const BLOCKS_BOTS = new Set([401, 403, 405, 429, 451, 999]);
	async function worker() {
		while (i < urls.length) {
			const url = urls[i++];
			try {
				const res = await fetch(url, { method: "GET", redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (compatible; pinoytechie-linkcheck)" }, signal: AbortSignal.timeout(15_000) });
				if (!res.ok && !BLOCKS_BOTS.has(res.status)) externalBroken.push({ url, why: `HTTP ${res.status}`, pages: [...external.get(url)] });
			} catch (e) {
				externalBroken.push({ url, why: e.name === "TimeoutError" ? "no answer in 15 seconds" : (e.cause?.code ?? e.message), pages: [...external.get(url)] });
			}
		}
	}
	await Promise.all(Array.from({ length: 6 }, worker));
}

const lines = [];
if (broken.length) {
	lines.push(`❌ **${broken.length} broken internal link${broken.length === 1 ? "" : "s"}**`);
	for (const b of broken.slice(0, 25)) lines.push(`- \`${b.page}\` links to \`${b.link}\`: ${b.why}`);
	if (broken.length > 25) lines.push(`- …and ${broken.length - 25} more`);
} else {
	lines.push(`✅ Site built and all ${checked} internal links and anchors work.`);
}
if (externalBroken.length) {
	lines.push(`⚠️ **${externalBroken.length} external link${externalBroken.length === 1 ? "" : "s"} did not answer**`);
	for (const b of externalBroken.slice(0, 25)) lines.push(`- ${b.url} (${b.why}), used on ${b.pages.slice(0, 3).join(", ")}`);
}
console.log(lines.join("\n"));
if (reportFile) await fs.appendFile(reportFile, `\n\n### Link check\n${lines.join("\n")}\n`);
process.exit(broken.length || externalBroken.length ? 1 : 0);
