export interface Step {
	title: string;
	description: string;
}
export interface Faq {
	question: string;
	answer: string;
}
export interface Video {
	id: string;
	title: string;
	description: string;
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
		"Plain-language guides to MariBank and everyday money apps in the Philippines.",
	description:
		"Pinoy Techie publishes independent, plain-language guides, comparisons and video tutorials on MariBank, GCash and digital banking in the Philippines.",

	logo: { src: "/logo.png", small: "/logo-128.png", width: 512, height: 512 },
	ogImage: "/og-default.png",
	ogImageAlt: "Pinoy Techie logo: an eagle with lightning bolts on a yellow circle",

	// For E-E-A-T you can switch this to a real person:
	// { type: "Person", name: "Your Name", url: "/about/" }
	author: { type: "Organization" as "Organization" | "Person", name: "Pinoy Techie", url: "/about/" },

	googleSiteVerification: "vTIvCa0HAYNx_WC4BmJOGzhgaNgLdWyI0aM6nYGhOrw",

	nav: [
		{ label: "Home", href: "/" },
		{ label: "Guides", href: "/blog/" },
		{ label: "Videos", href: "/videos/" },
		{ label: "About", href: "/about/" },
		{ label: "Contact", href: "/contact/" },
	],

	footer: {
		explore: [
			{ label: "MariBank referral code", href: "/" },
			{ label: "All guides", href: "/blog/" },
			{ label: "Videos", href: "/videos/" },
			{ label: "RSS feed", href: "/rss.xml" },
		],
		company: [
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
		email: "", // e.g. "hello@pinoytechie.lol"
	},

	// Featured video on the home page (youtube.com/watch?v=<id>)
	video: {
		id: "qHHuN3Y3FzA",
		si: "m6GFuCP9fZHsGQrw",
		title: "Pinoy Techie featured video",
		heading: "Watch the walkthrough",
		text: "Prefer to see it on screen? This video shows the sign-up flow so you know what to expect before you deposit.",
	},

	// Shown on /videos/. Add more entries to list more videos.
	videos: [
		{
			id: "qHHuN3Y3FzA",
			title: "Pinoy Techie featured video",
			description: "The latest featured tutorial from the Pinoy Techie channel.",
		},
	] satisfies Video[],

	legalUpdated: "2026-11-21", // update whenever Privacy Policy / Terms / Disclosure change

	referral: {
		code,
		bonus,
		minDeposit,
		holdDays,
		title: `MariBank Referral Code ${code}: Get ${bonus} (2026)`,
		description: `Use MariBank referral code ${code} when you sign up. Deposit ${minDeposit}, keep it ${holdDays} days, and get ${bonus} rewards. Step-by-step guide, updated October 2026.`,
		usersCount: 823,
		usersCountAsOf: "2026-10-03", // update this date whenever you update the count
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
