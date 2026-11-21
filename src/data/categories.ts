/**
 * Guide categories. Each one is a "section" of the Guides area:
 *   /blog/                          the hub: lists every category (pinned ones first)
 *   /blog/category/<slug>/          one category, with its posts (paginated)
 *   /blog/<post-slug>/              a post (URL never changes with the category)
 *
 * HOW TO ADD A NEW CATEGORY (example: "GCash Guide")
 *   1. Put the logo in /public, e.g. /public/gcash-logo.png (square, ~128px is plenty).
 *   2. Copy the MariBank block below, paste it under it and change the values:
 *        { slug: "gcash", name: "GCash Guide", logo: "/gcash-logo.png", ... }
 *   3. In each post's frontmatter add:   category: "gcash"
 *   Done. The hub, the category page, the breadcrumbs, the sitemap and the
 *   navigation bar all pick it up automatically.
 *
 * Options
 *   pinned: true   shown first on the hub with a "Pinned" badge.
 *   inNav:  true   gets its own button (with logo) in the top navigation.
 *   logo:   optional. Without it a letter badge is shown instead.
 *
 * A category with no published posts is hidden from the hub and navigation
 * until its first post goes live (its page still exists but is noindex).
 */
export interface Category {
	/** URL part, lowercase, no spaces. Used in frontmatter `category:` */
	slug: string;
	/** Shown everywhere (navigation, cards, headings, breadcrumbs) */
	name: string;
	/** One or two sentences for the card and the category page intro */
	description: string;
	/** Optional <title> for Google (50-60 chars). Falls back to name. */
	seoTitle?: string;
	/** Optional meta description. Falls back to description. */
	seoDescription?: string;
	logo?: string;
	pinned?: boolean;
	inNav?: boolean;
}

export const categories: Category[] = [
	{
		slug: "maribank",
		name: "MariBank Guide",
		description:
			"Everything about MariBank: is it legit, savings and time deposit rates, fees, safety, comparisons and how to get the most from the sign-up reward.",
		seoTitle: "MariBank Guides and Comparisons",
		seoDescription:
			"Plain-language guides on MariBank: is it legit, how it compares with GCash, savings rates, fees, and how to get the most from the sign-up reward.",
		logo: "/maribank-logo.png",
		pinned: true,
		inNav: true,
	},
	// { slug: "gcash", name: "GCash Guide", description: "...", logo: "/gcash-logo.png", inNav: true },
];

/** The category a post falls back to when its frontmatter has no `category:` */
export const defaultCategory: Category = categories.find((c) => c.pinned) ?? categories[0];

export function categoryPath(slug: string): string {
	return `/blog/category/${slug}/`;
}
