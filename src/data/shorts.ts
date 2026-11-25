import { loadYoutube, looksComplete } from "@/lib/youtube";

/**
 * YouTube Shorts shown on /shorts/.
 *
 * AUTOMATIC: before every build, scripts/sync-youtube.mjs reads your channel from the YouTube API
 * (title, newest first, view count). The workflow builds every 30 minutes, so a new Short appears
 * on its own. You do not have to edit anything here when you upload.
 *
 * The list further down (fallbackShorts) is only a safety net. It is used when the sync has not run
 * yet (no API key, YouTube down), so the page is never empty. You can leave it as it is.
 *
 * WHICH 4 ARE FEATURED: change `featuredConfig` below.
 *   mode: "latest"  your 4 newest Shorts (changes by itself when you upload)
 *         "views"   your 4 most viewed Shorts
 *         "pinned"  the ids you list in `pinned` below (the id is the part after youtube.com/shorts/).
 *                   This is what you had before, so your hand-picked 4 are kept.
 */
export interface Short {
	id: string;
	/** never shown on the page, only used as the image description for screen readers and search engines */
	title: string;
	/** exact view count, shown as a short label like "1.6M" on featured cards (automatic) */
	views?: number;
}

export const featuredConfig = {
	mode: "pinned" as "latest" | "views" | "pinned",
	count: 4,
	/** only used when mode is "pinned" */
	pinned: [
		"MVHWTo-JA-0",
		"RPpc071y9Kg",
		"INQmx6NJWQQ",
		"ODBncMfDpQ0",
	] as string[],
};

/** Safety net: used only when no synced YouTube data is available. */
const fallbackShorts: Short[] = [
	{ id: "MVHWTo-JA-0", title: "Billionaire Daughter Spotted Buying Ukay Ukay" },
	{ id: "RPpc071y9Kg", title: "He Spent All Night Trying to Save His Dying Dog" },
	{ id: "INQmx6NJWQQ", title: "The Philippine Cockroach Named After Pokémon" },
	{ id: "ODBncMfDpQ0", title: "Philippines Is No. 1 In The World For THESE 3 Things" },
	{ id: "iYYxRmfQ14w", title: "20 Places In The Philippines That Don't Feel Real!" },
	{ id: "1I6AEnG4wuQ", title: "Philippines Has a ₱5,000 and ₱3,000 Bill?" },
	{ id: "MUK81r6VijM", title: "Top 4 Largest Airports in the Philippines" },
	{ id: "jZoSFDZ1OCI", title: "Top 4 Most Popular Fast-Food Chains in the Philippines" },
	{ id: "PYhPCR1PSg8", title: "Top 4 Potential Future Presidents of the Philippines" },
	{ id: "sXxfNfjaFfc", title: "Japan Is Obsessed With This Filipino Banana" },
	{ id: "R0SgtA08wbg", title: "Top 5 Most Impressive Bridges in the Philippines" },
	{ id: "DsyOGcNMvL4", title: "Top 5 Underrated Whitest Beaches in Philippines" },
	{ id: "M2UR3gQc2I4", title: "Biggest Cruise Ship to Visit the Philippines" },
	{ id: "KFb9M375zZg", title: "US Is Obsessed With This Filipino UBE" },
	{ id: "fBnOo1EDKrk", title: "Filipino Seafarers Are Found on Ships Worldwide" },
	{ id: "u8RnkwJRtG4", title: "Filipinos Are Among The Best Cabin Crew In The World" },
	{ id: "ag60NvTaXaU", title: "Most Powerful Missile in the Philippines" },
	{ id: "lqQ3Rtr-JLA", title: "15 Years Old, 50 People Rescued" },
	{ id: "3UBuhIXdDbE", title: "Filipino Saved 12 People From Floodwaters" },
	{ id: "Bp3VBUS8KVY", title: "Filipino Invented An Airplane Sealant From Tree Waste" },
	{ id: "h8Mzrj2CqtQ", title: "Philippines Has a Nuclear Plant That Never Ran" },
	{ id: "esYLb2RtWWc", title: "The \"Greece of the Philippines\"" },
	{ id: "H-2vVk1sWRs", title: "Largest Dam in the Philippines Is Among the World's Biggest" },
	{ id: "CwrAG9C6uVY", title: "Water Running Dragon Of The Philippines" },
	{ id: "hHG4hCOB7eo", title: "This Province Has Almost Black Sand Beaches" },
	{ id: "0n9Z4H-XUdA", title: "Filipino Invents Unsinkable Boat" },
	{ id: "r8EnBjvTxc4", title: "Tricycle Driver Found 800K And Returned It All" },
	{ id: "CxYDnelIgaY", title: "Boy Scout Gave His Life Protecting His Classmates" },
	{ id: "tFBUFaJi89M", title: "Japanese Telecom Wants to Operate in the Philippines" },
	{ id: "OTIxjsGYQdM", title: "Giant Crab Can Climb Trees And Crack Coconuts" },
	{ id: "I1FwZTqBcSQ", title: "The Philippines Has A Sea Bunny That's Actually Toxic" },
	{ id: "1TO6YF6EgKw", title: "Why Teachers Are Bringing Piko Back" },
	{ id: "y9G_36XJHBw", title: "The Mangrove Apple You've Never Heard Of" },
	{ id: "QjeyD6UADdM", title: "Philippines Has A Pink Banana" },
	{ id: "a3EL9U1i1zc", title: "Philippines Has Mini Fire Trucks For Narrow Streets" },
	{ id: "tyj6LrTg8sY", title: "This Appliance Is Still Eating Electricity Even When Off" },
	{ id: "03oNreFX6Ko", title: "This Parasite Turns Praying Mantises Into Zombies" },
	{ id: "uiDoH2ob3t8", title: "The Fruit Banned From Hotels And Airplanes" },
	{ id: "WweXx53lQvo", title: "The Impossible Journey Of A Wind Turbine Blade" },
	{ id: "khW75MFXYrg", title: "Tell Your Mom About This Rice Hack" },
	{ id: "4nEXf6jyMLw", title: "Why You Should Never Kill A House Gecko" },
	{ id: "dbWb6U7NN7A", title: "This Fish Has The Most Dangerous Job In The Sea" },
	{ id: "bq6lDlcuU7g", title: "Super El Niño Could Make The Philippines Much Hotter" },
	{ id: "gLBqx5wn4-w", title: "Babies Don't Need Sunlight For Vitamin D?" },
	{ id: "4RYfMo_jirc", title: "Filipino Scientists Built AI To Count Fish" },
	{ id: "SHjNT3SbL0o", title: "The Hidden Cables That Keep Philippine Internet Alive" },
	{ id: "WE8uUSWP2aM", title: "Scientists Found Microplastics In Philippine Honey" },
	{ id: "HFFl-NY9wA4", title: "This Philippine Sea Slug Is Named Dumbo" },
	{ id: "qcaR9wHkXVM", title: "This Philippine Fan Has Worked Since 1995" },
	{ id: "vDk9iPLTqZ8", title: "UP Manila Hasn't Failed The Nursing Boards Since 1948" },
	{ id: "lzjcIjqCYFM", title: "Filipino Students Sent An Experiment To Space" },
	{ id: "Te-1QTMSsww", title: "Deadly Japanese Jellyfish Found In Philippines" },
	{ id: "nby086a5ec4", title: "This Philippine Hill Has BLUE Soil" },
	{ id: "ivjaxNWx4SU", title: "This 'Worm' In The Philippines Isn't Actually A Worm" },
	{ id: "S7HpxuvUT9Y", title: "Exhausted Mom Put Baby Bottle In Her Best Friends Mouth" },
	{ id: "jyirC325qpY", title: "China Built Drone Stations While West Still Uses Sidewalk Robots" },
	{ id: "HjDNLz1didU", title: "Bench Player Went Viral After Moving Exactly Like Stephen Curry" },
	{ id: "n82NOGMPLvw", title: "Filipino Brothers Had No Chill When Sister Skipped Lunch" },
	{ id: "S6xAHN5ZVT0", title: "Guy Went To 7Eleven Then Saw His Ex Girlfriend As Cashier" },
	{ id: "cWWoT64mVYc", title: "Siblings Turned Home Into Church And It Will Melt Your Heart" },
	{ id: "uMqKrJ3P5Y4", title: "When F4 Boys Appeared Whole School Got Romantic Thrill" },
	{ id: "pC99Nq-XTtY", title: "Filipino Dad First Ever TikTok Video Family Treated Him Like King" },
	{ id: "QeJ9aV0M5pk", title: "He Got Award But Mother Was Gone Before She Could See" },
	{ id: "PHTmJB9d-38", title: "Kid Cried For Lost Slipper Then Realized It Was In His Hand" },
	{ id: "h3f-UOUd-Zw", title: "Teacher Caught Student Playing Game Inside Book" },
	{ id: "rQCrXQJQ4Gk", title: "Dog Lost For Two Days Found Hiding In Old Tire" },
	{ id: "Fe-bDAL7Cv0", title: "Father Let His Son Learn How To Struggle" },
	{ id: "xVmYJe0HmcE", title: "The Moment This Boy Made Everyone Cry On Live TV" },
	{ id: "0mepRGbFdkw", title: "Vendor Thought She Got Real Money Then Saw Drawing" },
	{ id: "0ekAjdbmUVQ", title: "Server Dropped All Beers Then Almost Punched Janitor" },
	{ id: "kpc0y_ivz9A", title: "Couple Saves Tired Bird Floating In Water" },
	{ id: "OIEQm387JDk", title: "Filipino Host Thought It Was Normal Restaurant Then Saw Cobra" },
	{ id: "GWePBrbHXds", title: "Girl Thought She Got Christmas Gift Then Saw Cheating Screenshots" },
	{ id: "qjh4FWj1yKU", title: "Expired Nuts Almost Made Him Vomit On Live Stream" },
	{ id: "y0GjDILtZ94", title: "Strangers Surround Blind Couple With Red Flowers" },
	{ id: "XJ0CYdtPEqw", title: "This Mang Inasal Hack Is Too Smart" },
	{ id: "lzswvS3A-Do", title: "This Baby Already Unlocked The Trick" },
	{ id: "Y2so1vDt1lk", title: "Mom Fighting Cancer Cries As Son Cuts Her Hair" },
	{ id: "xHVm8Tz4yv0", title: "This GEN Z Jeepney Driver Might Have Found Love" },
	{ id: "KU1LFibjPig", title: "Fellow Filipino Gets Pranked Hard" },
	{ id: "NmeAjts4mxk", title: "The Moment He Realized His Dog Was Gone Forever" },
	{ id: "1QR77_aul3E", title: "The Roads Were Deadly Until He Showed Up" },
	{ id: "0_dbXfBtH0I", title: "She Saved Her Dogs and Survived" },
	{ id: "qGMSsO9IUiw", title: "He Let Manny Pacquiao Punch Him" },
	{ id: "MVS4z8QQqG0", title: "The Eyebrow Prank Gone Too Far" },
	{ id: "ui5fOEY4xjM", title: "The Foreigner Got Tricked So Bad" },
	{ id: "g9MLefc5hBY", title: "Fire Melted His Face to His Shoulder" },
	{ id: "XhhJ2st0fW8", title: "She Wanted a Bird So Bad" },
	{ id: "SPhnSCzmZGk", title: "Selfless Kid Buys Food for Needy" },
	{ id: "DNcVCI5oLi8", title: "He Was Selling Art for His Mom" },
	{ id: "Ddj0ofwoYSs", title: "Selling Just to Survive" },
	{ id: "z3Q9sK_UF9U", title: "This Boy Saved His Baby Brother" },
	{ id: "pPY6ePewDHc", title: "She Was Behind Him the Whole Time" },
	{ id: "Beh20NLF5Cg", title: "He Cheers Loudest for His Brother" },
	{ id: "tifbiGDS9Xo", title: "The Carabao Cried Real Tears" },
	{ id: "lSPnA_7kbuk", title: "She Kept Smiling Through the Pain" },
	{ id: "wOjfzo5Ct9Q", title: "This Boy Almost Ruined the Race" },
	{ id: "vqdrUcDJjI4", title: "Abandoned Monkey Hugs Toy for Comfort" },
	{ id: "OTOdVm5AsjU", title: "She Thought He Was Cheating" },
	{ id: "uXdRj-zUasY", title: "They Tried to Beat Anesthesia" },
	{ id: "PQpUe36H7D8", title: "A Depressed Dog and a Kind Boy" },
	{ id: "KC5Wl0eUE88", title: "Graduation Day Humiliation to Success Story" },
	{ id: "kZVBHXqx5TM", title: "Love Never Gets Old" },
	{ id: "6hTAxkpH8Z4", title: "This Baby Saved Her Father" },
	{ id: "UGDNu45xjMI", title: "Boyfriend Meets Protective Dad" },
	{ id: "DKivQezkWjk", title: "He Gave Each Kid $100 For Scoring 94 And Above" },
	{ id: "jEeD-UdOr48", title: "He Served His Country, Then The World Served Him Back" },
	{ id: "5O_U6AE9OWM", title: "These Kids Are Learning Math By Playing Tug Of War" },
	{ id: "kYmjX9fLvpw", title: "A Simple Act Of Kindness On The Side Of The Road" },
	{ id: "l50e4yxB5lA", title: "This Chess Board Called Him Out For Cheating" },
	{ id: "H4_8OZ9EPcY", title: "From Roadside Stranger To Family Member" },
	{ id: "fzaRMLcmsKk", title: "He Bought His Own Casket To Give His Wife Peace" },
	{ id: "eUdRxOcNNyo", title: "The Boss Who Stood Up To A Rude Customer" },
	{ id: "1x2XkrkX6-g", title: "Her Dog Follows Commands Too Perfectly" },
	{ id: "ABkpwqyKFhs", title: "Man Drops Everything To Hug His Donkey" },
	{ id: "XCFLHJfxrLc", title: "Wakeboarding In Heels To Confuse The AI" },
	{ id: "RuUhAkl4zG4", title: "Music Videos Are Harder Than They Look" },
	{ id: "hLG0RnVc_d8", title: "The Funniest Yoga Class Ever" },
	{ id: "rMms6s7k7bw", title: "How Theater Magic is Really Made" },
	{ id: "vuYPjJIliSI", title: "His Daughters Reaction To His Hard Earned Gift" },
	{ id: "8duXL1B3eAk", title: "He Beat Every Carnival Game in One Day" },
	{ id: "t6Z8BH6kkcU", title: "A Different Kind of Zombie Apocalypse" },
	{ id: "ivSbabLm3xE", title: "Dropping His Phone in 26 Feet of Water (What Happened?)" },
	{ id: "vRcW4UaoVq8", title: "His Baby Learned to Walk Like an Old Man" },
	{ id: "BhfqtzRkZ-g", title: "Inside The Most Unpredictable House Ever Built" },
	{ id: "vcHmDk6K4XE", title: "Promoting A Headset On A Roller Coaster" },
	{ id: "O-5LHUQFePY", title: "His Tears Tell The Whole Story" },
	{ id: "6B6BrglYhuw", title: "A Living Room Show Just For Their Little One" },
	{ id: "E3ph1qZUZ8o", title: "The VR That Made Him Scream & Hide" },
	{ id: "w7D6-hJXq34", title: "A Portrait From the Sweetest Little Business" },
	{ id: "Y1OlEPFx6Jk", title: "When Your Commute Becomes a Comedy Show" },
	{ id: "QhpA2rngZTk", title: "Worlds Largest Indoor Ski Resort Tour" },
	{ id: "EGFKpFmEpWs", title: "When Jackie Chan Finally Shows the Pain" },
	{ id: "P7X8A8aICvE", title: "The 9 Year Old Fashion Designer Walking the Runway" },
	{ id: "aZDLKemzIMU", title: "Why This Japanese Festival Has No Brakes" },
	{ id: "qVPII2hemis", title: "Would You Save a Snake in Your Yard?" },
];

/** Synced list when available and plausible, otherwise the hand-written safety net. */
function buildShorts(): Short[] {
	const yt = loadYoutube();
	if (yt && looksComplete(yt.shorts.length, fallbackShorts.length, "shorts list")) {
		return yt.shorts.map((s) => ({ id: s.id, title: s.title, views: s.views }));
	}
	return fallbackShorts;
}

export const shorts: Short[] = buildShorts();

function pickFeatured(): Short[] {
	const { mode, count, pinned } = featuredConfig;
	if (mode === "pinned") {
		const picked = pinned.map((id) => shorts.find((s) => s.id === id)).filter((s): s is Short => !!s);
		if (picked.length) return picked.slice(0, count);
	}
	if (mode === "views" && shorts.some((s) => s.views !== undefined)) {
		return [...shorts].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, count);
	}
	return shorts.slice(0, count); // "latest" (the list is newest first)
}

/** Up to `featuredConfig.count` pinned shorts */
export const featuredShorts = pickFeatured();

/** Everything else, newest first */
export const otherShorts = shorts.filter((s) => !featuredShorts.includes(s));

/**
 * Shorts thumbnails are 16:9 images with the vertical video in the middle, so the page
 * crops them to 9:16. maxresdefault is sharpest; the page falls back to sd/hq if missing.
 */
export const shortThumbs = (id: string) => [
	`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
	`https://i.ytimg.com/vi/${id}/sddefault.jpg`,
	`https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
];
export const shortUrl = (id: string) => `https://www.youtube.com/shorts/${id}`;
