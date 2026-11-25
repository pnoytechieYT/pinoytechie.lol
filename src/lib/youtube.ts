import fs from "node:fs";
import path from "node:path";

/**
 * Reads .cache/youtube.json, written by scripts/sync-youtube.mjs before each build.
 * Returns null when there is no usable data, and the data files then use their hand-written lists.
 */
export interface YtItem {
	id: string;
	title: string;
	publishedAt?: string;
	views?: number;
	/** seconds */
	duration?: number;
}
export interface YtPlaylist {
	name: string;
	ids: string[];
}
export interface YtData {
	fetchedAt: string;
	channelId: string;
	videos: YtItem[];
	shorts: YtItem[];
	playlists: YtPlaylist[];
}

/** YouTube requires stored API data to be refreshed within 30 days. Older data is ignored. */
const MAX_AGE_DAYS = 25;

let memo: YtData | null | undefined;

export function loadYoutube(): YtData | null {
	if (memo !== undefined) return memo;
	memo = null;
	try {
		const file = path.join(process.cwd(), ".cache", "youtube.json");
		const data = JSON.parse(fs.readFileSync(file, "utf8")) as YtData;
		const ok = Array.isArray(data.videos) && Array.isArray(data.shorts) && Date.parse(data.fetchedAt) > 0;
		if (!ok) return memo;
		const ageDays = (Date.now() - Date.parse(data.fetchedAt)) / 86_400_000;
		if (ageDays > MAX_AGE_DAYS) {
			console.warn(`[youtube] saved data is ${Math.floor(ageDays)} days old, ignoring it`);
			return memo;
		}
		data.playlists ??= [];
		memo = data;
		console.log(`[youtube] using synced data from ${data.fetchedAt}: ${data.videos.length} videos, ${data.shorts.length} shorts`);
	} catch {
		// no file yet: normal on a first build or without an API key
	}
	return memo;
}

/**
 * Safety check: only trust the synced list when it is at least 70% as long as the hand-written one,
 * so a partial answer from YouTube can never make half the site disappear.
 */
export function looksComplete(synced: number, handWritten: number, what = "list"): boolean {
	const ok = synced > 0 && synced >= Math.floor(handWritten * 0.7);
	if (!ok && loadYoutube()) {
		console.warn(`[youtube] synced ${what} has ${synced} items but the hand-written one has ${handWritten}: looks incomplete, using the hand-written ${what}`);
	}
	return ok;
}
