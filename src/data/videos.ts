/**
 * Videos shown on /videos/ and the home page.
 *
 * HOW TO ADD A VIDEO
 *   1. Copy a block below and paste it at the top of the list (newest first).
 *   2. id: the part after  youtube.com/watch?v=  (or after /shorts/).
 *   3. featured: true  = pinned at the top of /videos/ with the big player.
 *                         The FIRST featured video is also the one on the home page.
 *      featured: false (or leave it out) = normal video in the grid.
 *   4. category: any label ("MariBank", "Tech Tips", ...). Filter buttons appear
 *      automatically on /videos/ once you have two or more categories.
 *   5. si: optional, the ?si= share token from a YouTube share link.
 */
export interface Video {
	id: string;
	title: string;
	/** optional short line under the title */
	description?: string;
	featured?: boolean;
	category?: string;
	si?: string;
}

export const videos: Video[] = [
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
];

/** Featured videos first-class, in list order. */
export const featuredVideos = videos.filter((v) => v.featured);
/** Everything that is not featured, in list order. */
export const otherVideos = videos.filter((v) => !v.featured);
/** The video used on the home page: first featured one, else the first video. */
export const homeVideo: Video = featuredVideos[0] ?? videos[0];

export const videoCategories = [...new Set(videos.map((v) => v.category).filter((c): c is string => !!c))];
