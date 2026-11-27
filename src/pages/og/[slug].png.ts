import type { APIRoute, GetStaticPaths } from "astro";
import fs from "node:fs";
import path from "node:path";
import satori from "satori";
import sharp from "sharp";
import { getCategory, getPosts } from "@/lib/posts";
import { siteData } from "@/data/site";

/**
 * One social-share image (1200x630) per guide, made at build time: /og/<slug>.png
 * It is used for og:image / twitter:image and the BlogPosting structured data, so a guide shared on
 * Facebook, Messenger, Viber or X shows its own title instead of the same logo for every post.
 * A guide can still set its own `image:` in the frontmatter, which wins over this one.
 */
const root = process.cwd();
const fontDir = path.join(root, "node_modules", "@fontsource", "space-grotesk", "files");
const readFont = (file: string) => fs.readFileSync(path.join(fontDir, file));
// The latin-ext file holds the peso sign (₱). Satori only falls back between fonts with DIFFERENT names,
// so it is registered as "Space Grotesk Ext" and listed second in fontFamily below.
const fonts = [
	{ name: "Space Grotesk", data: readFont("space-grotesk-latin-700-normal.woff"), weight: 700 as const, style: "normal" as const },
	{ name: "Space Grotesk Ext", data: readFont("space-grotesk-latin-ext-700-normal.woff"), weight: 700 as const, style: "normal" as const },
];

const dataUri = (publicPath: string) => {
	const file = path.join(root, "public", publicPath.replace(/^\//, ""));
	return `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;
};

// Fixed pixel sizes: satori's percentage and flex sizing let the card spill over the canvas.
const W = 1200;
const H = 630;
const CARD_W = W - 36 - 50; // 1114
const CARD_H = H - 36 - 50; // 544
const INNER_W = CARD_W - 2 * 8 - 2 * 48; // 1002: card width minus border and horizontal padding
const INK = "#111111";
const SUN = "#ffea00";
const CREAM = "#fffdf2";

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
	type,
	props: { style, ...(children === undefined ? {} : { children }), ...extra },
});

const clip = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`);

export const getStaticPaths: GetStaticPaths = () =>
	getPosts().map((post) => {
		const category = getCategory(post.category)!;
		return {
			params: { slug: post.slug },
			props: { title: post.meta.title, category: category.shortName ?? category.name, group: category.group, logo: category.logo, ai: Boolean(post.meta.aiGenerated) },
		};
	});

export const GET: APIRoute = async ({ props }) => {
	const { title, category, logo, ai } = props as { title: string; category: string; logo?: string; ai: boolean };
	const text = clip(title, 105);
	const size = text.length > 80 ? 54 : text.length > 55 ? 64 : 76;

	const chip = h(
		"div",
		{ display: "flex", alignItems: "center", gap: 14, background: INK, color: SUN, padding: "10px 22px", fontSize: 28, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 },
		[
			logo ? h("img", { width: 40, height: 40, borderRadius: 8 }, undefined, { src: dataUri(logo), width: 40, height: 40 }) : "",
			category,
		].filter(Boolean),
	);

	const top = h("div", { display: "flex", justifyContent: "space-between", alignItems: "center", width: INNER_W }, [
		h("div", { display: "flex", alignItems: "center", gap: 16 }, [
			h("img", { width: 56, height: 56, borderRadius: 28 }, undefined, { src: dataUri(siteData.logo.small), width: 56, height: 56 }),
			h("div", { display: "flex", fontSize: 34, fontWeight: 700, textTransform: "uppercase", color: INK }, siteData.name),
		]),
		chip,
	]);

	const middle = h("div", { display: "flex", flex: 1, alignItems: "center", width: INNER_W }, [
		h("div", { display: "flex", fontSize: size, fontWeight: 700, lineHeight: 1.08, color: INK, letterSpacing: -1 }, text),
	]);

	const bottom = h("div", { display: "flex", justifyContent: "space-between", alignItems: "center", width: INNER_W, fontSize: 28, fontWeight: 700, color: INK }, [
		h("div", { display: "flex" }, new URL(siteData.url).hostname),
		ai
			? h("div", { display: "flex", border: `3px solid ${INK}`, padding: "6px 16px", background: SUN, fontSize: 24, textTransform: "uppercase" }, "AI-generated guide")
			: h("div", { display: "flex", border: `3px solid ${INK}`, padding: "6px 16px", background: SUN, fontSize: 24, textTransform: "uppercase" }, "Plain-language guide"),
	]);

	const card = h(
		"div",
		{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-start", position: "absolute", left: 36, top: 36, width: CARD_W, height: CARD_H, boxSizing: "border-box", background: CREAM, border: `8px solid ${INK}`, boxShadow: `14px 14px 0 0 ${INK}`, padding: "40px 48px" },
		[top, middle, bottom],
	);
	const tree = h("div", { display: "flex", position: "relative", width: W, height: H, background: SUN, fontFamily: "Space Grotesk, Space Grotesk Ext" }, [card]);

	const svg = await satori(tree as never, { width: W, height: H, fonts });
	const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toBuffer();
	return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
};
