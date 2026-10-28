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
	tagline:
		"Plain-language guides to MariBank and everyday money apps in the Philippines.",

	nav: [
		{ label: "Code", href: "/" },
		{ label: "Blog", href: "/blog/" },
		{ label: "About", href: "/about/" },
	],

	// Fill these in. Empty values are hidden automatically.
	social: {
		youtube: "https://www.youtube.com/@pinoy.techie", // e.g. "https://www.youtube.com/@yourhandle"
		email: "", // e.g. "hello@pinoytechie.lol"
	},

	referral: {
		code,
		bonus,
		minDeposit,
		holdDays,
		title: `MariBank Referral Code ${code}: Get ${bonus} (2026)`,
		description: `Use MariBank referral code ${code} when you sign up. Deposit ${minDeposit}, keep it ${holdDays} days, and get ${bonus} rewards. Step-by-step guide, updated October 2026.`,
		usersCount: 823,
		usersCountAsOf: "2026-10-03", // update this date whenever you update the count
		updated: "2026-10-28", // update whenever promo terms change
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
