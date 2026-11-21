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

	for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
		const text = fs.readFileSync(path.join(dir, file), "utf8");
		const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
		const updated = front.match(/^updatedDate:\s*(.+)$/m)?.[1];
		const published = front.match(/^pubDate:\s*(.+)$/m)?.[1];
		const date = toDate(updated ?? published ?? "");
		if (date) map.set(file.replace(/\.md$/, ""), date);
	}
	return map;
}

const postLastmods = readPostLastmods();

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
			filter: (page) => !page.includes("/blog/tag/") && !page.includes("/404"),
			serialize(item) {
				const slug = item.url.match(/\/blog\/([^/]+)\/?$/)?.[1];
				const lastmod = slug && slug !== "tag" ? postLastmods.get(slug) : undefined;
				if (lastmod) item.lastmod = lastmod.toISOString();
				return item;
			},
		}),
	],
});
