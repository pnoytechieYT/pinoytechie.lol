// @ts-check
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import {
	remarkStripCitations,
	rehypeCallouts,
	rehypeTables,
	rehypeFigures,
	rehypeHeadingAnchors,
	rehypeExternalLinks,
	rehypeCodeBlocks,
} from "./src/plugins/markdown.mjs";

const SITE = "https://pinoytechie.lol";
const PH_OFFSET = "+08:00"; // Philippine time, keep in sync with src/data/site.ts

/**
 * Accurate <lastmod> for blog posts only (Google ignores lastmod when it is
 * wrong, so pages without a real modified date simply get none).
 */
function readPostLastmods() {
	const dir = path.resolve("src/posts");
	const map = new Map();
	if (!fs.existsSync(dir)) return map;

	const toDate = (raw) => {
		let v = raw.trim().replace(/^["']|["']$/g, "").replace(" ", "T");
		if (/^\d{4}-\d{2}-\d{2}$/.test(v)) v += "T00:00:00";
		if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(v)) v += PH_OFFSET;
		const d = new Date(v);
		return Number.isNaN(d.getTime()) ? undefined : d;
	};

	// Posts live in src/posts/<category>/<slug>.md. The URL slug is the file name only.
	const files = [];
	const walk = (folder) => {
		for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
			const full = path.join(folder, entry.name);
			if (entry.isDirectory()) walk(full);
			else if (entry.name.endsWith(".md")) files.push(full);
		}
	};
	walk(dir);

	for (const file of files) {
		const text = fs.readFileSync(file, "utf8");
		const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
		const updated = front.match(/^updatedDate:\s*(.+)$/m)?.[1];
		const published = front.match(/^pubDate:\s*(.+)$/m)?.[1];
		const date = toDate(updated ?? published ?? "");
		if (date) map.set(path.basename(file, ".md"), date);
	}
	return map;
}

const postLastmods = readPostLastmods();

/**
 * Category folders that have at least one LIVE post (not a draft, pubDate already passed).
 * A category page without posts is noindex, so it must not be listed in the sitemap either
 * (Search Console reports "Submitted URL marked noindex" otherwise).
 */
function readLiveCategories() {
	const root = path.resolve("src/posts");
	const live = new Set();
	if (!fs.existsSync(root)) return live;
	for (const folder of fs.readdirSync(root, { withFileTypes: true })) {
		if (!folder.isDirectory()) continue;
		for (const file of fs.readdirSync(path.join(root, folder.name))) {
			if (!file.endsWith(".md")) continue;
			const front = fs.readFileSync(path.join(root, folder.name, file), "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
			if (/^draft:\s*true\s*$/m.test(front)) continue;
			let raw = (front.match(/^pubDate:\s*(.+)$/m)?.[1] ?? "").trim().replace(/^["']|["']$/g, "").replace(" ", "T");
			if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) raw += "T00:00:00";
			if (raw && !/(Z|[+-]\d{2}:?\d{2})$/i.test(raw)) raw += PH_OFFSET;
			const date = new Date(raw);
			if (Number.isNaN(date.getTime()) || date > new Date()) continue;
			live.add(folder.name);
			break;
		}
	}
	return live;
}

const liveCategories = readLiveCategories();

// https://astro.build/config
export default defineConfig({
	site: SITE,
	compressHTML: true,
	markdown: {
		gfm: true, // tables, task lists, strikethrough, footnotes, autolinks
		smartypants: true, // curly quotes, en/em dashes, ellipses
		syntaxHighlight: "shiki",
		shikiConfig: { theme: "github-dark-dimmed", wrap: false },
		remarkPlugins: [remarkStripCitations],
		rehypePlugins: [rehypeCallouts, rehypeTables, rehypeFigures, rehypeHeadingAnchors, rehypeExternalLinks, rehypeCodeBlocks],
	},
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [
		sitemap({
			// Tag archives are navigation aids, keep them out of the sitemap.
			// Empty category pages are noindex, so they are kept out too.
			filter: (page) => {
				if (page.includes("/blog/tag/") || page.includes("/404")) return false;
				const category = page.match(/\/blog\/category\/([^/]+)\//)?.[1];
				return !category || liveCategories.has(category);
			},
			serialize(item) {
				const slug = item.url.match(/\/blog\/([^/]+)\/?$/)?.[1];
				const lastmod = slug && slug !== "tag" ? postLastmods.get(slug) : undefined;
				if (lastmod) item.lastmod = lastmod.toISOString();
				return item;
			},
		}),
	],
});
