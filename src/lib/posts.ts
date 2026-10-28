import type { MarkdownInstance } from "astro";

export interface PostMeta {
	title: string;
	description: string;
	pubDate: string;
	updatedDate?: string;
	tags?: string[];
	draft?: boolean;
}

export interface Post {
	slug: string;
	meta: PostMeta;
	Content: MarkdownInstance<PostMeta>["Content"];
	minutes: number;
	pubDate: Date;
	updatedDate: Date;
}

const modules = import.meta.glob<MarkdownInstance<PostMeta>>(
	"../posts/*.md",
	{ eager: true },
);

export function getPosts(): Post[] {
	return Object.entries(modules)
		.map(([path, mod]) => {
			const slug = path.split("/").pop()!.replace(/\.md$/, "");
			const meta = mod.frontmatter as PostMeta;
			const words = (mod.rawContent?.() ?? "").split(/\s+/).filter(Boolean).length;
			return {
				slug,
				meta,
				Content: mod.Content,
				minutes: Math.max(1, Math.ceil(words / 200)),
				pubDate: new Date(meta.pubDate),
				updatedDate: new Date(meta.updatedDate ?? meta.pubDate),
			};
		})
		.filter((post) => !post.meta.draft)
		.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
}

export function formatDate(date: Date): string {
	return date.toLocaleDateString("en-PH", {
		year: "numeric",
		month: "long",
		day: "numeric",
		timeZone: "UTC",
	});
}
