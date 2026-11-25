import type { MarkdownInstance, MarkdownHeading } from "astro";
import { siteData } from "@/data/site";
import { categories, categoryPath, defaultCategory, type Category } from "@/data/categories";

/**
 * Frontmatter of a post in src/posts/<category>/<slug>.md
 *
 * Folder layout:  src/posts/maribank/  src/posts/gcash/  src/posts/maya/
 * The folder name is the category slug, so `category:` in the frontmatter is
 * optional. If you do write it, it must match the folder. The URL is built from
 * the file name only (/blog/<slug>/), so moving a post between folders never
 * changes its address. File names must be unique across ALL folders.
 *
 * pubDate / updatedDate are date-times. ALWAYS wrap them in quotes:
 *   pubDate: "2026-11-25T09:00:00+08:00"   (+08:00 = Philippine time)
 * If you leave off the offset, Philippine time is assumed.
 * A pubDate in the FUTURE = scheduled post: it is hidden from the public site
 * (pages, blog list, tags, RSS, sitemap, llms.txt) until that time has passed
 * AND the site has been rebuilt (the deploy workflow rebuilds every 30 minutes).
 */
export interface PostMeta {
	title: string;
	/** Optional shorter <title> for Google (aim for 50-60 characters). Falls back to title. */
	seoTitle?: string;
	description: string;
	pubDate: string | Date;
	updatedDate?: string | Date;
	/** Category slug from src/data/categories.ts, e.g. "maribank" or "gcash" */
	category?: string;
	tags?: string[];
	draft?: boolean;
	image?: string;
	/** Set `aiGenerated: true` on posts written with AI. Shows an "AI-generated guide" badge and note. */
	aiGenerated?: boolean;
}

export interface Post {
	slug: string;
	meta: PostMeta;
	Content: MarkdownInstance<PostMeta>["Content"];
	headings: MarkdownHeading[];
	minutes: number;
	wordCount: number;
	/** resolved category slug (always valid) */
	category: string;
	tags: string[];
	pubDate: Date;
	updatedDate: Date;
	/** true only in `npm run dev` for posts whose pubDate is still in the future */
	isScheduled: boolean;
}

const modules = import.meta.glob<MarkdownInstance<PostMeta>>("../posts/**/*.md", {
	eager: true,
});

const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

function parseDate(value: unknown, field: string, file: string): Date {
	let date: Date | undefined;

	if (value instanceof Date) {
		date = value;
	} else if (typeof value === "string") {
		let raw = value.trim().replace(" ", "T");
		if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) raw += "T00:00:00";
		if (!HAS_ZONE.test(raw)) raw += siteData.timezoneOffset;
		date = new Date(raw);
	}

	if (!date || Number.isNaN(date.getTime())) {
		throw new Error(
			`[posts] ${file}: "${field}" is missing or not a valid date. ` +
				`Use a quoted ISO date-time such as "2026-11-25T09:00:00+08:00".`,
		);
	}
	return date;
}

function loadPosts(): Post[] {
	const now = Date.now();
	const seen = new Map<string, string>();

	return Object.entries(modules).map(([path, mod]) => {
		const parts = path.split("/");
		const file = parts.pop()!;
		const slug = file.replace(/\.md$/, "");
		// "../posts/gcash/foo.md" -> folder "gcash"; "../posts/foo.md" -> no folder
		const folder = parts.length > 2 ? parts[parts.length - 1].toLowerCase() : undefined;
		const meta = mod.frontmatter as PostMeta;

		if (seen.has(slug)) {
			throw new Error(
				`[posts] duplicate file name "${slug}.md" in "${seen.get(slug)}" and "${folder ?? "posts"}". ` +
					`File names become URLs, so they must be unique across all category folders.`,
			);
		}
		seen.set(slug, folder ?? "posts");

		if (!meta.title || !meta.description) {
			throw new Error(`[posts] ${file}: "title" and "description" are required.`);
		}

		const declared = meta.category?.trim().toLowerCase();
		if (declared && folder && declared !== folder) {
			throw new Error(
				`[posts] ${folder}/${file}: frontmatter says category "${declared}" but the file is in the "${folder}" folder. ` +
					`Move the file or fix the category.`,
			);
		}
		let category = declared ?? folder;
		if (!category) {
			category = defaultCategory.slug;
			console.warn(`[posts] ${file}: no category folder or "category:" in frontmatter, using "${category}".`);
		}
		if (!categories.some((c) => c.slug === category)) {
			throw new Error(
				`[posts] ${file}: category "${category}" does not exist. ` +
					`Add it in src/data/categories.ts or use one of: ${categories.map((c) => c.slug).join(", ")}.`,
			);
		}

		const pubDate = parseDate(meta.pubDate, "pubDate", file);
		const updatedDate = meta.updatedDate
			? parseDate(meta.updatedDate, "updatedDate", file)
			: pubDate;
		const wordCount = (mod.rawContent?.() ?? "").split(/\s+/).filter(Boolean).length;

		return {
			slug,
			meta,
			Content: mod.Content,
			headings: mod.getHeadings?.() ?? [],
			minutes: Math.max(1, Math.ceil(wordCount / 200)),
			wordCount,
			category,
			tags: meta.tags ?? [],
			pubDate,
			updatedDate: updatedDate < pubDate ? pubDate : updatedDate,
			isScheduled: pubDate.getTime() > now,
		};
	});
}

/**
 * Posts that are visible to the public: not a draft and already published.
 * Scheduled (future) posts are included ONLY while running `npm run dev`
 * so you can preview them; they are never part of a production build.
 */
export function getPosts(): Post[] {
	const preview = import.meta.env.DEV;
	return loadPosts()
		.filter((post) => !post.meta.draft && (preview || !post.isScheduled))
		.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
}

export function getPostsByCategory(slug: string, posts: Post[] = getPosts()): Post[] {
	return posts.filter((p) => p.category === slug);
}

export interface CategoryInfo extends Category {
	count: number;
	path: string;
}

/**
 * Categories for the hub / navigation: pinned first, then in the order they are
 * written in categories.ts. Categories without published posts are left out
 * unless includeEmpty is true.
 */
export function getCategories(opts: { includeEmpty?: boolean } = {}): CategoryInfo[] {
	const posts = getPosts();
	return categories
		.map((c, i) => ({ c, i }))
		.sort((a, b) => Number(!!b.c.pinned) - Number(!!a.c.pinned) || a.i - b.i)
		.map(({ c }) => ({ ...c, count: getPostsByCategory(c.slug, posts).length, path: categoryPath(c.slug) }))
		.filter((c) => opts.includeEmpty || c.count > 0);
}

export function getCategory(slug: string): CategoryInfo | undefined {
	return getCategories({ includeEmpty: true }).find((c) => c.slug === slug);
}

export function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export interface TagInfo {
	name: string;
	slug: string;
	count: number;
}

export function getTags(posts: Post[] = getPosts()): TagInfo[] {
	const map = new Map<string, TagInfo>();
	for (const post of posts) {
		for (const name of post.tags) {
			const slug = slugify(name);
			const entry = map.get(slug) ?? { name, slug, count: 0 };
			entry.count += 1;
			map.set(slug, entry);
		}
	}
	return [...map.values()].sort(
		(a, b) => b.count - a.count || a.name.localeCompare(b.name),
	);
}

/** Related posts: most shared tags first, then newest. */
export function getRelated(post: Post, limit = 3): Post[] {
	return getPosts()
		.filter((p) => p.slug !== post.slug)
		.map((p) => ({
			p,
			score: p.tags.filter((t) => post.tags.includes(t)).length + (p.category === post.category ? 0.5 : 0),
		}))
		.sort((a, b) => b.score - a.score || b.p.pubDate.getTime() - a.p.pubDate.getTime())
		.slice(0, limit)
		.map((x) => x.p);
}

const dateFmt = new Intl.DateTimeFormat(siteData.locale, {
	year: "numeric",
	month: "long",
	day: "numeric",
	timeZone: siteData.timezone,
});
const dateTimeFmt = new Intl.DateTimeFormat(siteData.locale, {
	year: "numeric",
	month: "long",
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
	timeZone: siteData.timezone,
});

/** "November 21, 2026" in Philippine time */
export function formatDate(date: Date): string {
	return dateFmt.format(date);
}

/** "November 21, 2026 at 9:00 AM PHT" in Philippine time */
export function formatDateTime(date: Date): string {
	return `${dateTimeFmt.format(date)} PHT`;
}
