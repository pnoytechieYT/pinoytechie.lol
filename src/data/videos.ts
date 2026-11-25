import { loadYoutube, looksComplete } from "@/lib/youtube";

/**
 * Videos shown on /videos/ and the home page.
 *
 * AUTOMATIC: before every build, scripts/sync-youtube.mjs reads your channel from the YouTube API
 * (every public video, newest first, current title). The workflow builds every 30 minutes, so a new
 * upload shows up by itself. You do not have to add it here.
 *
 * This list (manualVideos) is still useful for things YouTube does not know about. For any video
 * id listed here, these values are used:
 *   - category:     the filter button on /videos/ ("MariBank", "WiFi & SIM", ...)
 *   - description:  the optional line under the title
 *   - featured:     true = pinned at the top of /videos/ with the big player.
 *                   The FIRST featured video is also the one on the home page.
 *   - si:           optional ?si= token from a YouTube share link
 * It is also the safety net used if the sync has not run (no API key, YouTube down).
 *
 * CATEGORIES WITHOUT EDITING CODE: for a NEW video with no entry below, the category comes from your
 * YouTube playlists. Put it in a playlist that is named exactly like an existing category
 * (for example "Gadgets"), or name a playlist "Site: Smart Home" to create a new category
 * "Smart Home". Videos in no such playlist show without a category (they still appear under "All").
 */
export interface Video {
	id: string;
	title: string;
	/** optional short line under the title */
	description?: string;
	featured?: boolean;
	category?: string;
	si?: string;
	/** exact view count from YouTube (automatic) */
	views?: number;
}

const manualVideos: Video[] = [
	{
		id: "qHHuN3Y3FzA",
		si: "m6GFuCP9fZHsGQrw",
		title: "Maribank New Features With Get Free Money!",
		description: "See what's new in MariBank and how the sign-up and referral flow works before you deposit.",
		featured: true,
		category: "MariBank",
	},
	{ id: "Q7kIiZgdZMM", title: "How to Redeem Free 12-Month Prime Video Subscription (1 Minute!)", category: "Apps & Tips" },
	{ id: "T_PW4AW6yTI", title: "DITO FlexPlan SIM Activation - Unboxing at Honest Speed Test!", category: "WiFi & SIM" },
	{ id: "nqTGLQZELHQ", title: "How to Apply for DITO FlexPlan Online - COMPLETE GUIDE", category: "WiFi & SIM" },
	{ id: "6wksJ7ZzxWI", title: "Globe At Home Prepaid WiFi SIM Unboxing + Honest Speed Test", category: "WiFi & SIM" },
	{ id: "K7QhzIXdkRo", title: "Smart FAM SIM Review - Gagana Kaya Sa Smart 5G Max Modem?", category: "WiFi & SIM" },
	{ id: "T5mqFJzU4_I", title: "Trick Kung Paano Malalaman Kung Smart, Globe, o DITO Ang Cellsite", category: "WiFi & SIM" },
	{ id: "VKLGANZ2ezQ", title: "Smart Home WiFi SIM Review - Gagana Kaya Sa Smart 5G Max?", category: "WiFi & SIM" },
	{ id: "YMEY4sSpBis", title: "Smart 5G Max Home WiFi H173-381 Review - Honest Speed Test", category: "WiFi & SIM" },
	{ id: "HdN_CR79E9k", title: "MIMO Antenna Calibration For 4G And 5G WiFi Modems - Ganito Dapat!", category: "WiFi & SIM" },
	{ id: "SyrVlkxkX-o", title: "I Put My Best WiFi Near A Cell Tower - Here's What Happened", category: "WiFi & SIM" },
	{ id: "wnJvlILmHqI", title: "How To Unlock/Openline Smart 5G WiFi and PLDT 5G Plus | H153-381 H155-382", category: "WiFi & SIM" },
	{ id: "MTgfE7fXhac", title: "DITO Vs Globe Vs Smart Sim Only Plan 2026 - Napaka Murang 5G Unli Internet Tohhh!", category: "WiFi & SIM" },
	{ id: "yZHaX2MaLz8", title: "ZTE Vs Dito Modem Honest Speed Test Philippines - Sobrang Lakas Ng Isa!", category: "WiFi & SIM" },
	{ id: "fOMuIj4rMKQ", title: "ZTE G5 Pro MC8512 With 13dbi - Ang Daming Antenna Sa Loob Neto!", category: "WiFi & SIM" },
	{ id: "JcdrEzLIt2w", title: "Mchose Ace 68 Turbo Hall Unboxing - Galaxy Orange Mount Tai", category: "Gadgets" },
	{ id: "7g48a5lWmI4", title: "JuanFi Piso WiFi System Using Comfast EW Series", category: "Piso WiFi" },
	{ id: "r8jBMaq83Uc", title: "Part 5: Connecting Pins Into Baseboard - JuanFi Wireless Based ESP8266 NodeMCU", category: "Piso WiFi" },
	{ id: "usg1cUu8TQU", title: "Part 4: ESP8266 Binding & Portal Upload - JuanFi Wireless Based ESP8266 NodeMCU", category: "Piso WiFi" },
	{ id: "Wh0YBwf1mDY", title: "Part 3: ESP8266 Flashing & JuanFi Setup - JuanFi Wireless Based ESP8266 NodeMCU", category: "Piso WiFi" },
	{ id: "6O-9HMQFQkc", title: "Part 2: HAPLite Setup - JuanFi Wireless Based ESP8266 NodeMCU", category: "Piso WiFi" },
	{ id: "dWhcjODUHdk", title: "Part 1: Requirements - JuanFi Wireless Based ESP8266 NodeMCU", category: "Piso WiFi" },
	{ id: "fsFS3fQrBUc", title: "JLab Epic 3 Sport ANC Unboxing | Solid Sport Earphone!", category: "Gadgets" },
	{ id: "8D_wWvm1phk", title: "Smart Bro Rocket Sim With Unli Data & ZTE F50 Pro", category: "WiFi & SIM" },
	{ id: "qRXQLmo4JJA", title: "Smart Rocket Sim Unlimited Internet - No Capping & No Limit", category: "WiFi & SIM" },
	{ id: "pXyV9B2vjxU", title: "Maya App Login Failed - Paano I-escalate Sa BSP?", category: "Apps & Tips" },
	{ id: "CRO_R90Xmo4", title: "My 3 Month Experience with Xiaoxin Pad Pro 2025 - Sobrang Sulit Pa Ba?", category: "Gadgets" },
	{ id: "codCNF_DRp8", title: "Tecno Megapad Pro 12 Inch Unboxing - Budget Flagship Tablet with Keyboard!", category: "Gadgets" },
	{ id: "KsQoqkkiTaw", title: "Fifine Amplitank T688 Unboxing - Budget Mic Kit With BM88 Boom Arm!", category: "Gadgets" },
	{ id: "b8N4iWorsGU", title: "How to Register and Update PhilHealth Online in 2026", category: "Apps & Tips" },
	{ id: "7V5RExVHpbc", title: "How To Fix Unauthorized GCash & Maya Transactions (Step-by-step)", category: "Apps & Tips" },
	{ id: "1wVsNh2BWVM", title: "How To Fix CapCut \"Security Notice\" On PC", category: "Apps & Tips" },
	{ id: "WTccFvS2gbg", title: "How to Transfer GCash to HelloMoney 2026 - Step by Step Tutorial", category: "Apps & Tips" },
	{ id: "mEyWmwaqNAs", title: "Messenger Voice Message Download - The Easiest Methods That Actually Work", category: "Apps & Tips" },
	{ id: "YKnsunKJiEI", title: "How to Boost WiFi Signal Using Signal Status Table (SINR, RSRQ, RSRP)", category: "WiFi & SIM" },
	{ id: "Jn7L7JM1gCk", title: "Smart 5G Max Turbo WiFi Unboxing - Budget 5G Router Speed Test", category: "WiFi & SIM" },
	{ id: "jhuw9zjeeyE", title: "PLDT WiFi H153-381 vs ZTE F50 5G - Which 5G Router is Better?", category: "WiFi & SIM" },
	{ id: "EQfHNvvFXzA", title: "Lenovo Xiaoxin Pad Pro 2025 Unboxing - Worth 10.3K Lang!", category: "Gadgets" },
	{ id: "KJ_SthTTIOs", title: "PLDT WiFi Unblock All Sites - Cloudflare DNS Method Revealed", category: "WiFi & SIM" },
	{ id: "_QUb85gjoIQ", title: "Buy Globe Rain 101 Router For Unsupported Area", category: "WiFi & SIM" },
	{ id: "fYo5eLji5Kc", title: "How to Contact Lazada Live Agent - Easiest Method!", category: "Apps & Tips" },
	{ id: "MW27_7GDbOc", title: "Unable To Login Sa Maya App", category: "Apps & Tips" },
	{ id: "IoD5wvidGbw", title: "MXQ Pro 5G 4K TV Box Unboxing - Budget Streaming Box or Scam?", category: "Gadgets" },
	{ id: "LrAyHFrdNgU", title: "ZTE F50 5G WiFi Modem Unboxing - So Small It Fits In Your Wallet", category: "WiFi & SIM" },
	{ id: "eGAUj5FCyy4", title: "4G LTE USB Modem with WiFi Hotspot - Unboxing & Review!", category: "WiFi & SIM" },
	{ id: "b2mBHQit9S0", title: "PLDT Home Fibr Change WiFi Password", category: "WiFi & SIM" },
	{ id: "1xMCAjWgsZw", title: "Converge WiFi Residential Plan Mas Pinabilis - From 20Mbps to 300Mbps+", category: "WiFi & SIM" },
	{ id: "fTIyXfjiZG4", title: "Paano Malaman Ang DITO Number 2025", category: "WiFi & SIM" },
	{ id: "zxVxl2_v5gg", title: "DITO \"WOWFI\" 5G+ Home WiFi Unboxing & Review H151-370", category: "WiFi & SIM" },
	{ id: "pS7V30XqRUo", title: "PLDT Home 5G+ Modified Antenna - 40 to 300+ Mbps Upgrade! | H153-381 & H155-382", category: "WiFi & SIM" },
	{ id: "SnUSt7PoOpc", title: "PLDT HOME WIFI 5G+ DISASSEMBLE AND ASSEMBLE | H153-381 MODEM TEARDOWN", category: "WiFi & SIM" },
	{ id: "IcpkzlsHD1s", title: "PLDT HOME 5G+ OPENLINE | H153-381 & H155-382 UNLOCK", category: "WiFi & SIM" },
	{ id: "ccbUDbmT0WA", title: "PLDT Home WiFi 5G+ H153-381 Unboxing - Budget 5G Router Revealed!", category: "WiFi & SIM" },
	{ id: "ZRLjuFec4IM", title: "V380 Pro Rewards Center - Get Free Cloud Recording Without Paying!", category: "Apps & Tips" },
	{ id: "ocONmf4vdBs", title: "Block MLBB on Any WiFi Device Using Converge - Step by Step", category: "WiFi & SIM" },
	{ id: "ZYJ6CDds7-g", title: "OPEN AI FACEBOOK MESSENGER INTEGRATION", category: "Apps & Tips" },
	{ id: "TfTDsEo0ukU", title: "How to Block Users on Converge WiFi 2025 - Easy Tutorial", category: "WiFi & SIM" },
	{ id: "vkjBxwU9www", title: "How to Change Converge WiFi Password 2025 - Easy Tutorial", category: "WiFi & SIM" },
	{ id: "M6ESnqklYRM", title: "ZLT S12 PRO OPENLINE USING SMART ROCKET SIM | ANG BAGAL SAMIN HAHA", category: "WiFi & SIM" },
	{ id: "QSKSjlyPupY", title: "GLOBE AT HOME ZLT S12 PRO SUPER ADMIN & OPENLINE", category: "WiFi & SIM" },
	{ id: "F1FUG_qcVE4", title: "GLOBE AT HOME ZLT S12 PRO UNBOXING REVIEW", category: "WiFi & SIM" },
	{ id: "FZMm4llXLWw", title: "SMART ROCKET SIM WITH UNLI DATA TEST IN PLDT R281 AND FX-ID5 | SINO ANG MAS MABILIS?", category: "WiFi & SIM" },
	{ id: "q-Hksc-f3u0", title: "PLDTHOME EVOLUZN FX-ID5 UNBOXING | ANG MURA PERO ANG LAKASS!", category: "WiFi & SIM" },
	{ id: "qxOxdAY2rOI", title: "SMARTBRO ROCKET SIMCARD NA BLOCK? GAWIN MO'TO!", category: "WiFi & SIM" },
	{ id: "ZxbzUFZDs3c", title: "SMART BRO 4G+ LTE BOOSTEVEN R281 UNBOXING", category: "WiFi & SIM" },
	{ id: "YeCB0UoH4tI", title: "NO UNLI PROMO IN GIGA LIFE TRICKS", category: "WiFi & SIM" },
	{ id: "sF4Cv8C7nss", title: "ZLT-S10G NO WIFI PROBLEM | HINDI NA-ILAW AT WALA SA LIST NG WIFI", category: "WiFi & SIM" },
	{ id: "Hba7RieeAvg", title: "Gawin mo'to sa GCash mo Bago ka Magsisi!!! | UNLINK GCASH IN PLAYSTORE", category: "Apps & Tips" },
	{ id: "lOwbYVzmKjo", title: "ZLT-S10G GLOBE DEFAULT FIRMWARE | 2.00, 2.03, 2.03.7, & 2.06 | ALL VERSION!", category: "WiFi & SIM" },
	{ id: "Ps7yL1Livgw", title: "SMARTBRO MF920TS WIFI RESET 2021 | LTE POCKET WIFI HARDRESET", category: "WiFi & SIM" },
	{ id: "WrKgAYtrlL4", title: "DITO ENABLED VOLTE FEATURE | SECRET CODE FOR VOLTE", category: "WiFi & SIM" },
	{ id: "CQyF8JSy2A4", title: "ZLT-S10G RED LIGHT INDICATOR 2021 | NO SIGNAL-SERVICE | RESOLVE!", category: "WiFi & SIM" },
	{ id: "3i-EPfHSfLI", title: "Dito Telecom Free SIM Card 2021 - How To Avail Even If Your Phone Isn't Compatible!", category: "WiFi & SIM" },
	{ id: "GdK0DPt7ZfI", title: "DITO TELECOM 2021 - Paano Mag Avail Ng DITO? Initial Launching Guide", category: "WiFi & SIM" },
	{ id: "ihLtmtgARf8", title: "Turn Your Old Router Into A WiFi Extender - WAN To LAN Hack!", category: "WiFi & SIM" },
	{ id: "8dF4qnPwNsk", title: "Can't Access WiFi GUI? Fix the Login Page for SmartBro & Globe Modems", category: "WiFi & SIM" },
	{ id: "9ZzonMDNbrM", title: "Pocket WiFi SD Card - Hidden Feature Most Users Don't Know!", category: "WiFi & SIM" },
	{ id: "zF4g-N6Ix3c", title: "Openline SmartBro LTE Pocket WiFi M028AT - Free Unlock Method with Proof!", category: "WiFi & SIM" },
	{ id: "5yjmnRKqX-s", title: "How To Setup Smart Bro LTE Pocket WiFi - Full Tutorial", category: "WiFi & SIM" },
	{ id: "__8aWmXzlRI", title: "How To Reset Smart Bro Pocket WiFi - New LTE Pocket WiFi Guide", category: "WiFi & SIM" },
];

/** Featured videos first-class, in list order. */
const normalize = (name: string) => name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();

/** Synced list when available and plausible, otherwise the hand-written list. */
function buildVideos(): Video[] {
	const yt = loadYoutube();
	if (!yt || !looksComplete(yt.videos.length, manualVideos.length, "videos list")) return manualVideos;

	const manual = new Map(manualVideos.map((v) => [v.id, v]));
	const known = new Map(manualVideos.filter((v) => v.category).map((v) => [normalize(v.category!), v.category!]));

	/** category from a playlist: its name matches a known category, or it starts with "Site:" */
	const fromPlaylists = (id: string): string | undefined => {
		for (const pl of yt.playlists) {
			if (!pl.ids.includes(id)) continue;
			const match = known.get(normalize(pl.name));
			if (match) return match;
			const m = pl.name.match(/^site:\s*(.+)$/i);
			if (m) return m[1].trim();
		}
		return undefined;
	};

	return yt.videos.map((a) => {
		const m = manual.get(a.id);
		return {
			id: a.id,
			title: a.title,
			description: m?.description,
			featured: m?.featured,
			category: m?.category ?? fromPlaylists(a.id),
			si: m?.si,
			views: a.views,
		};
	});
}

export const videos: Video[] = buildVideos();

export const featuredVideos = videos.filter((v) => v.featured);
/** Everything that is not featured, in list order. */
export const otherVideos = videos.filter((v) => !v.featured);
/** The video used on the home page: first featured one, else the first video. */
export const homeVideo: Video = featuredVideos[0] ?? videos[0];

export const videoCategories = [...new Set(videos.map((v) => v.category).filter((c): c is string => !!c))];
