import type { APIContext } from "astro";
import { getPosts } from "@/lib/posts";
import { siteData } from "@/data/site";

// A plain-text site summary for AI assistants and crawlers (llmstxt.org convention).
export function GET(context: APIContext) {
	const site = context.site!.toString().replace(/\/$/, "");
	const posts = getPosts();
	const { referral } = siteData;

	const lines = [
		`# ${siteData.name}`,
		"",
		`> ${siteData.description}`,
		"",
		"Independent site. Not affiliated with MariBank or Sea Group. Not financial advice.",
		"",
		"## Key pages",
		"",
		`- [MariBank referral code ${referral.code}](${site}/): code, reward (${referral.bonus} after a ${referral.minDeposit} deposit kept ${referral.holdDays} days), steps and FAQ. Updated ${referral.updated}.`,
		`- [All guides](${site}/blog/): every article`,
		`- [Videos](${site}/videos/): video tutorials`,
		`- [About](${site}/about/): who runs the site and how guides are written`,
		`- [Referral disclosure](${site}/disclosure/): how the site earns`,
		`- [Contact](${site}/contact/)`,
		"",
		"## Guides",
		"",
		...posts.map(
			(p) => `- [${p.meta.title}](${site}/blog/${p.slug}/): ${p.meta.description}`,
		),
		"",
	];

	return new Response(lines.join("\n"), {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
}
