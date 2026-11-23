export interface Step {
	title: string;
	description: string;
}
export interface Faq {
	question: string;
	answer: string;
}

const code = "MBPINOY2027";
const bonus = "₱588";
const minDeposit = "₱1,000";
const holdDays = 3;

export const siteData = {
	name: "Pinoy Techie",
	url: "https://pinoytechie.lol",
	locale: "en-PH",
	timezone: "Asia/Manila",
	timezoneOffset: "+08:00", // Philippine time. Dates without an offset are read as this.
	tagline:
		"Philippine facts and stories in videos and Shorts, plus plain-language MariBank guides.",
	description:
		"Philippine facts and stories in videos and Shorts from the Pinoy Techie YouTube channel, plus independent, plain-language MariBank guides.",

	logo: { src: "/logo.png", small: "/logo-128.png", width: 512, height: 512 },
	// MariBank's own app icon, shown so visitors can recognise it
	maribankLogo: "/maribank-logo.png",
	ogImage: "/og-default.png",
	ogImageAlt: "Pinoy Techie logo: an eagle with lightning bolts on a yellow circle",

	// For E-E-A-T you can switch this to a real person:
	// { type: "Person", name: "Your Name", url: "/about/" }
	author: { type: "Organization" as "Organization" | "Person", name: "Pinoy Techie", url: "/about/" },

	googleSiteVerification: "vTIvCa0HAYNx_WC4BmJOGzhgaNgLdWyI0aM6nYGhOrw",

	nav: [
		{ label: "Home", href: "/" },
		// "expand" = replaced by one button per category that has inNav: true (src/data/categories.ts)
		{ label: "Guides", href: "/blog/", expand: "categories" },
		{ label: "Videos", href: "/videos/" },
		{ label: "Shorts", href: "/shorts/" },
		// { label: "About", href: "/about/" },
		// { label: "Contact", href: "/contact/" },
	],

	/** How many items per page, and how many topic tags to show under the list */
	paging: { postsPerPage: 9, videosPerPage: 12, shortsPerPage: 20, maxTags: 10 },

	footer: {
		explore: [
			{ label: "MariBank referral code", href: "/" },
			{ label: "All guides", href: "/blog/" },
			{ label: "Videos", href: "/videos/" },
			{ label: "Shorts", href: "/shorts/" },
			{ label: "RSS feed", href: "/rss.xml" },
		],
		discover: [
			{ label: "About", href: "/about/" },
			{ label: "Contact", href: "/contact/" },
			{ label: "Referral disclosure", href: "/disclosure/" },
		],
		legal: [
			{ label: "Privacy Policy", href: "/privacy-policy/" },
			{ label: "Terms of Use", href: "/terms/" },
		],
	},

	// Empty values are hidden automatically.
	social: {
		youtube: "https://www.youtube.com/@pinoy.techie",
		email: "contact@pinoytechie.lol", // e.g. "hello@pinoytechie.lol"
	},

	// Home page video block wording. The video itself is the first `featured: true`
	// entry in src/data/videos.ts (that file also controls the /videos/ page).
	video: {
		heading: "Watch the walkthrough",
		text: "Prefer to see it on screen? This video shows the sign-up flow so you know what to expect before you deposit.",
	},

	legalUpdated: "2026-11-21", // update whenever Privacy Policy / Terms / Disclosure change

	referral: {
		code,
		bonus,
		minDeposit,
		holdDays,
		title: `MariBank Referral Code ${code}: Get ${bonus} (2026)`,
		description: `Use MariBank referral code ${code} when you sign up. Deposit ${minDeposit}, keep it ${holdDays} days, and get ${bonus} rewards. Step-by-step guide, updated October 2026.`,
		usersCount: 869,
		usersCountAsOf: "2026-11-20", // update this date whenever you update the count
		updated: "2026-11-21", // update whenever promo terms change
	},

	steps: [
		{
			title: "Download the MariBank app",
			description:
				"Get the official app from Google Play or the App Store using the buttons on this page, so you don't install a lookalike.",
		},
		{
			title: "Sign up and enter the code",
			description: `Create a new MariBank account and enter ${code} when the app asks for a referral code, before you finish registering.`,
		},
		{
			title: `Deposit ${minDeposit} and keep it for ${holdDays} days`,
			description: `Cash in ${minDeposit} from any e-wallet, bank, or existing MariBank account. Leave it in for ${holdDays} days and you receive the ${bonus} reward.`,
		},
	] satisfies Step[],

	faqs: [
		{
			question: "What is the MariBank referral code?",
			answer: `The referral code is ${code}. Enter it when you create your new MariBank account.`,
		},
		{
			question: "How much is the reward?",
			answer: `New users receive ${bonus} after a first ${minDeposit} deposit that stays in the account for ${holdDays} days.`,
		},
		{
			question: "Can I add the code after I sign up?",
			answer: `Enter it during registration. If you already have a MariBank account, check the promo terms in the app to see whether you still qualify.`,
		},
		{
			question: "Is MariBank safe?",
			answer:
				"MariBank Philippines is a licensed digital bank, and deposits are insured by PDIC up to ₱1,000,000 per depositor. Read our guide for what else to check before you deposit.",
		},
		{
			question: "Is this website part of MariBank?",
			answer:
				"No. Pinoy Techie is an independent website that shares a referral code. Reward terms are set by MariBank and can change at any time.",
		},
	] satisfies Faq[],
};

export type SiteData = typeof siteData;
