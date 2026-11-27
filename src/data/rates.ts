/**
 * Savings rates used by the calculator at /tools/savings-interest-calculator/.
 *
 * HOW TO KEEP THIS HONEST (it is a money site, so please do not skip this):
 *   1. When a bank changes a rate, edit `tiers` below and set `asOf` to the date you checked it.
 *   2. Put the OFFICIAL page you checked in `sources`. Keep our own guide in `guide`.
 *   3. A row older than STALE_AFTER_DAYS is shown with a "check the app" warning automatically.
 *
 * Rates are % per year (p.a.), BEFORE the 20% withholding tax.
 *   mode "marginal": each rate applies only to the slice of the balance up to `upTo`
 *                    (MariBank: 3.25% on the first ₱1,000,000, 3.75% on the part above).
 *   mode "band":     the balance decides ONE rate for the whole balance, the first band whose `upTo` is above it
 *                    (UNO: 3.00% below ₱5,000, 3.50% from ₱5,000).
 *   `upTo: null` means "no upper limit". If the balance is above the last band's limit the row shows "not covered".
 */

export const WITHHOLDING_TAX = 0.2; // 20% final tax on deposit interest
export const STALE_AFTER_DAYS = 45;

export interface RateTier {
	upTo: number | null;
	rate: number;
}

export interface RateProduct {
	id: string;
	name: string;
	provider: string;
	mode: "marginal" | "band";
	tiers: RateTier[];
	/** Best-case rows (promo boosts) are hidden until the visitor opts in. */
	bestCase?: boolean;
	note: string;
	/** YYYY-MM-DD: the day the rate was last checked against the sources */
	asOf: string;
	sources: { label: string; url: string }[];
	/** Our own guide that explains this product */
	guide: string;
}

const GSAVE_SOURCE = {
	label: "GCash Help Center, GSave interest rates and limits",
	url: "https://help.gcash.com/hc/en-us/articles/4414721290521-What-are-the-GSave-Interest-Rates-and-Transaction-Limits",
};

export const products: RateProduct[] = [
	{
		id: "maribank-savings",
		name: "MariBank Savings",
		provider: "MariBank",
		mode: "marginal",
		tiers: [
			{ upTo: 1_000_000, rate: 3.25 },
			{ upTo: null, rate: 3.75 },
		],
		note: "3.25% on the first ₱1,000,000 and 3.75% only on the part above it. Interest is credited daily. No maintaining balance.",
		asOf: "2026-11-27",
		sources: [
			{ label: "MariBank, Savings", url: "https://www.maribank.ph/product/savings" },
			{ label: "MariBank, Fees & Rates", url: "https://www.maribank.ph/fees-rates" },
		],
		guide: "/blog/maribank-savings-rate-guide/",
	},
	{
		id: "maya-savings",
		name: "Maya Savings (base rate)",
		provider: "Maya",
		mode: "band",
		tiers: [{ upTo: null, rate: 3 }],
		note: "3% base rate on the whole balance, credited daily. Boosts are not included here.",
		asOf: "2026-11-25",
		sources: [{ label: "Maya Bank, Savings", url: "https://www.mayabank.ph/savings/" }],
		guide: "/blog/maya-savings-guide-interest-rate-and-how-to-start/",
	},
	{
		id: "maya-savings-boosted",
		name: "Maya Savings (best case with boost)",
		provider: "Maya",
		mode: "marginal",
		bestCase: true,
		tiers: [
			{ upTo: 100_000, rate: 15 },
			{ upTo: null, rate: 3 },
		],
		note: "Best case only. The boost goes up to 15% on the first ₱100,000 and depends on activity and campaigns. It is not guaranteed.",
		asOf: "2026-11-25",
		sources: [{ label: "Maya Bank, Savings", url: "https://www.mayabank.ph/savings/" }],
		guide: "/blog/maya-savings-guide-interest-rate-and-how-to-start/",
	},
	{
		id: "gsave-uno",
		name: "GCash GSave: UNO Digital Bank (#UNOReady)",
		provider: "UNO Digital Bank via GCash",
		mode: "band",
		tiers: [
			{ upTo: 5_000, rate: 3 },
			{ upTo: 5_000_000, rate: 3.5 },
		],
		note: "3.00% below ₱5,000 and 3.50% from ₱5,000 up to just under ₱5 million. A deposit limit applies until you upgrade the account.",
		asOf: "2026-11-25",
		sources: [GSAVE_SOURCE],
		guide: "/blog/gcash-gsave-guide-rates-and-partner-banks/",
	},
	{
		id: "gsave-cebuana",
		name: "GCash GSave: Cebuana Lhuillier Bank (eC-Savings)",
		provider: "Cebuana Lhuillier Bank via GCash",
		mode: "band",
		tiers: [{ upTo: null, rate: 3 }],
		note: "Daily and monthly in and out limits apply.",
		asOf: "2026-11-25",
		sources: [GSAVE_SOURCE],
		guide: "/blog/gcash-gsave-guide-rates-and-partner-banks/",
	},
	{
		id: "gsave-cimb",
		name: "GCash GSave: CIMB Bank",
		provider: "CIMB Bank via GCash",
		mode: "band",
		tiers: [{ upTo: null, rate: 2.3 }],
		note: "2.30% since June 1, 2026 (down from 2.60%). Credited monthly. CIMB Grow pays 4% for pre-selected users, which is not included here.",
		asOf: "2026-11-25",
		sources: [GSAVE_SOURCE],
		guide: "/blog/gcash-gsave-guide-rates-and-partner-banks/",
	},
	{
		id: "gsave-maybank",
		name: "GCash GSave: Maybank (EzySave+)",
		provider: "Maybank via GCash",
		mode: "band",
		tiers: [{ upTo: null, rate: 0.35 }],
		note: "A low rate compared with the other partners.",
		asOf: "2026-11-25",
		sources: [GSAVE_SOURCE],
		guide: "/blog/gcash-gsave-guide-rates-and-partner-banks/",
	},
	{
		id: "gsave-bpi",
		name: "GCash GSave: BPI (#MySaveUp)",
		provider: "BPI via GCash",
		mode: "band",
		tiers: [{ upTo: null, rate: 0.0925 }],
		note: "A balance cap applies.",
		asOf: "2026-11-25",
		sources: [GSAVE_SOURCE],
		guide: "/blog/gcash-gsave-guide-rates-and-partner-banks/",
	},
];
