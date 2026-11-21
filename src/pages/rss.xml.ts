import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts } from "@/lib/posts";
import { siteData } from "@/data/site";

export async function GET(context: APIContext) {
	const posts = getPosts();
	return rss({
		title: `${siteData.name} | Guides`,
		description: siteData.description,
		site: context.site!,
		customData: `<language>en-ph</language>`,
		items: posts.map((post) => ({
			title: post.meta.title,
			description: post.meta.description,
			pubDate: post.pubDate,
			link: `/blog/${post.slug}/`,
			categories: post.tags,
		})),
	});
}
