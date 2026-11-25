/**
 * Guide categories. Each one is a "section" of the Guides area:
 *   /blog/                          the hub: lists every category (pinned ones first)
 *   /blog/category/<slug>/          one category, with its posts (paginated)
 *   /blog/<post-slug>/              a post (URL never changes with the category)
 *
 * HOW TO ADD A NEW CATEGORY (example: "GoTyme Guide")
 *   1. Optional: put the logo in /public, e.g. /public/gotyme-logo.png (square, ~128px is plenty).
 *   2. Copy one of the blocks below, paste it under it and change the values:
 *        { slug: "gotyme", name: "GoTyme Guide", logo: "/gotyme-logo.png", ... }
 *   3. Create the folder src/posts/gotyme/ and put the Markdown files in it.
 *      The folder name must equal the slug, so no `category:` line is needed in the posts.
 *   Done. The hub, the category page, the breadcrumbs, the sitemap and the
 *   navigation bar all pick it up automatically.
 *
 * Groups
 *   Every category belongs to a group (`group:`), see `categoryGroups` below. Groups are the labelled
 *   sections in the navigation dropdown and on the Guides hub ("Banks & E-Wallets", "Internet Providers").
 *
 * Options
 *   group:     which section it belongs to ("banks" or "providers").
 *   shortName: optional, the short label used in the dropdown (e.g. "Globe/TM").
 *   badge:     optional, the 1-2 character badge shown when there is no logo (default: first letter of the name).
 *   pinned: true   shown first on the hub with a "Pinned" badge.
 *   inNav:  true   listed (with its logo) in the "Guide" dropdown in the top navigation.
 *   logo:   optional. Without it a letter badge is shown instead.
 *
 * A category with no published posts is hidden from the hub and navigation
 * until its first post goes live (its page still exists but is noindex).
 */
export type CategoryGroupId = "banks" | "providers";

export interface CategoryGroup {
	id: CategoryGroupId;
	/** The label shown above the categories (navigation dropdown, hub, category pages) */
	label: string;
	description: string;
}

export const categoryGroups: CategoryGroup[] = [
	{
		id: "banks",
		label: "Banks & E-Wallets",
		description: "Digital banks, traditional banks and e-wallets in the Philippines: fees, limits, safety and how to get started.",
	},
	{
		id: "providers",
		label: "Internet Providers",
		description: "Mobile networks and home internet providers in the Philippines: SIM, eSIM, data, billing and troubleshooting.",
	},
];

export interface Category {
	/** Which labelled section this category belongs to */
	group: CategoryGroupId;
	/** Short label for the navigation dropdown. Falls back to name. */
	shortName?: string;
	/** Badge text shown instead of a logo. Falls back to the first letter of the name. */
	badge?: string;
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
		group: "banks",
		shortName: "MariBank",
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
	{
		slug: "gcash",
		group: "banks",
		shortName: "GCash",
		name: "GCash Guide",
		description:
			"How to open and fully verify a GCash account, what GCash charges, the current wallet limits, and how GSave savings work.",
		seoTitle: "GCash Guides: Verify, Fees, Limits, GSave",
		seoDescription:
			"Plain-language GCash guides: how to get fully verified, the 2026 fees and wallet limits, and how GSave savings and its partner banks compare.",
		logo: "/gcash-logo.png",
		inNav: true,
	},
	{
		slug: "maya",
		group: "banks",
		shortName: "Maya",
		name: "Maya Guide",
		description:
			"Maya referral code, how to sign up and upgrade, how Maya Savings earns interest, and how Maya compares with GCash.",
		seoTitle: "Maya Guides: Referral Code, Upgrade, Savings",
		seoDescription:
			"Plain-language Maya guides: the Maya referral code and reward, how to upgrade your account, how Maya Savings interest works, and Maya vs GCash.",
		logo: "/maya-logo.png",
		inNav: true,
	},
	{
		slug: "more-banks-ewallets",
		group: "banks",
		shortName: "More",
		badge: "+",
		name: "More Banks & E-Wallets",
		description:
			"Guides to other banks and e-wallets in the Philippines, like GoTyme, Tonik, CIMB and the big traditional banks, plus how digital and traditional banking compare.",
		seoTitle: "More Philippine Banks and E-Wallet Guides",
		seoDescription:
			"Plain-language guides to other Philippine banks and e-wallets beyond MariBank, GCash and Maya: how they work, what to check and how they compare.",
		inNav: true,
	},
	{
		slug: "globe-tm",
		group: "providers",
		shortName: "Globe/TM",
		logo: "/globe-logo.png",
		name: "Globe and TM Guide",
		description:
			"Practical Globe and TM guides: SIM registration, eSIM, checking your data balance, paying your bill and fixing signal or slow data.",
		seoTitle: "Globe and TM Guides: SIM, eSIM, Data, Billing",
		seoDescription:
			"Plain-language Globe and TM guides: how to register your SIM, set up an eSIM, check data, pay your bill and fix signal or slow-data problems.",
		inNav: true,
	},
	{
		slug: "smart-tnt-sun",
		group: "providers",
		shortName: "Smart/TnT/Sun",
		logo: "/smart-logo.png",
		name: "Smart, TNT and Sun Guide",
		description:
			"Practical Smart and TNT guides, plus what happened to Sun: how the brands differ, SIM registration, eSIM, checking data and fixing common connection problems.",
		seoTitle: "Smart, TNT and Sun Guides: Brands, SIM, eSIM",
		seoDescription:
			"Plain-language Smart, TNT and Sun guides: how the brands differ, what happened to Sun, how to register your SIM and fix connection problems.",
		inNav: true,
	},
	{
		slug: "dito",
		group: "providers",
		shortName: "DITO",
		logo: "/dito-logo.png",
		name: "DITO Guide",
		description:
			"Practical DITO guides: SIM registration, number porting, checking coverage before you switch, eSIM and fixing common connection problems.",
		seoTitle: "DITO Guides: SIM, Porting, Coverage, eSIM",
		seoDescription:
			"Plain-language DITO guides: how to register your SIM, port your number, check coverage before you switch, set up an eSIM and fix connection problems.",
		inNav: true,
	},
	{
		slug: "more-internet-providers",
		group: "providers",
		shortName: "More",
		badge: "+",
		name: "More Internet Providers",
		description:
			"Guides to other internet providers in the Philippines, like PLDT, Converge and satellite internet, plus how to choose between fiber, prepaid WiFi and mobile data.",
		seoTitle: "More Philippine Internet Provider Guides",
		seoDescription:
			"Plain-language guides to other Philippine internet providers: what to check before you apply, how to test your speed and how to choose a home connection.",
		inNav: true,
	},
];

/** The category a post falls back to when its frontmatter has no `category:` */
export const defaultCategory: Category = categories.find((c) => c.pinned) ?? categories[0];

export function categoryPath(slug: string): string {
	return `/blog/category/${slug}/`;
}
