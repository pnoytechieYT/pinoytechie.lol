/**
 * Pulls your channel's videos and Shorts from the official YouTube Data API and saves them to
 * .cache/youtube.json. The site reads that file when it builds (see src/lib/youtube.ts).
 *
 *   - Runs automatically before every build (npm run build). The GitHub workflow rebuilds every
 *     30 minutes, so new uploads show up on the site within about half an hour.
 *   - Needs the secret YOUTUBE_API_KEY. Without it (or if YouTube is unreachable) this script
 *     just logs a warning and exits normally, and the site builds from the last saved data or
 *     from the hand-written lists in src/data/videos.ts and shorts.ts. It never breaks a build.
 *   - Cost: roughly 20 to 50 API units per run, out of your free 10,000 per day (48 runs a day is well under half).
 *
 * Run it by hand:   YOUTUBE_API_KEY=your-key npm run sync:youtube
 */
import fs from "node:fs/promises";
import path from "node:path";

const KEY = process.env.YOUTUBE_API_KEY;
const BASE = process.env.YOUTUBE_API_BASE ?? "https://www.googleapis.com/youtube/v3";
const OUT = path.join(process.cwd(), ".cache", "youtube.json");
const MAX_PLAYLISTS = 30; // channel playlists scanned for categories
const SHORT_MAX_SECONDS = 180; // fallback rule only: Shorts can be up to 3 minutes

const warn = (msg) => console.warn(`::warning title=YouTube sync::${msg}`);
const log = (msg) => console.log(`[youtube] ${msg}`);

/** One API call. Never logs the URL (it contains the key). Retries once on a server error. */
async function api(endpoint, params) {
	const url = new URL(`${BASE}/${endpoint}`);
	for (const [k, v] of Object.entries({ ...params, key: KEY })) url.searchParams.set(k, String(v));
	for (let attempt = 1; ; attempt++) {
		let res;
		try {
			res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
		} catch (e) {
			if (attempt < 2) continue;
			throw new Error(`${endpoint}: network error (${e.cause?.code ?? e.message})`);
		}
		const body = await res.json().catch(() => null);
		if (res.ok) return body;
		if (res.status >= 500 && attempt < 2) continue;
		const err = body?.error;
		const reason = err?.errors?.[0]?.reason ?? "";
		const e = new Error(`${endpoint}: HTTP ${res.status} ${reason} ${err?.message ?? ""}`.trim());
		e.status = res.status;
		e.reason = reason;
		throw e;
	}
}

/** All items of a playlist, newest first. Skips private/deleted entries. */
async function playlistItems(playlistId) {
	const items = [];
	let pageToken;
	do {
		const data = await api("playlistItems", {
			part: "snippet,contentDetails",
			playlistId,
			maxResults: 50,
			...(pageToken ? { pageToken } : {}),
		});
		for (const it of data.items ?? []) {
			const id = it.contentDetails?.videoId ?? it.snippet?.resourceId?.videoId;
			const title = it.snippet?.title ?? "";
			if (!id || title === "Private video" || title === "Deleted video") continue;
			items.push({ id, title, publishedAt: it.contentDetails?.videoPublishedAt ?? it.snippet?.publishedAt });
		}
		pageToken = data.nextPageToken;
	} while (pageToken);
	return items;
}

const isoSeconds = (iso = "") => {
	const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
	return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : undefined;
};

async function main() {
	if (!KEY) {
		log("YOUTUBE_API_KEY is not set, skipping (the site uses saved or hand-written lists).");
		return;
	}

	// Channel handle comes from site.ts so there is one place to change it.
	let handle = process.env.YOUTUBE_HANDLE;
	if (!handle) {
		const site = await fs.readFile(path.join(process.cwd(), "src/data/site.ts"), "utf8");
		handle = site.match(/youtube:\s*"https?:\/\/(?:www\.)?youtube\.com\/(@[^"/?]+)/)?.[1];
	}
	if (!handle) throw new Error("Could not find the YouTube @handle in src/data/site.ts");

	const ch = await api("channels", { part: "id,contentDetails", forHandle: handle });
	const channel = ch.items?.[0];
	if (!channel) throw new Error(`No channel found for ${handle}`);
	const channelId = channel.id;
	const uploadsId = channel.contentDetails?.relatedPlaylists?.uploads ?? `UU${channelId.slice(2)}`;
	log(`Channel ${handle} -> ${channelId}`);

	// Everything uploaded (authoritative list), plus the Shorts-only / Videos-only playlists
	// (UUSH / UULF) to tell them apart. Those two are unofficial, so they are optional.
	const optional = (p) => p.catch((e) => (log(`optional list unavailable: ${e.message}`), null));
	const [uploads, shortsList, longList] = await Promise.all([
		playlistItems(uploadsId),
		optional(playlistItems(`UUSH${channelId.slice(2)}`)),
		optional(playlistItems(`UULF${channelId.slice(2)}`)),
	]);
	const shortIds = shortsList ? new Set(shortsList.map((i) => i.id)) : null;
	const longIds = longList ? new Set(longList.map((i) => i.id)) : null;

	// Views, duration and visibility, 50 videos per call.
	const stats = new Map();
	for (let i = 0; i < uploads.length; i += 50) {
		const chunk = uploads.slice(i, i + 50).map((u) => u.id);
		const data = await api("videos", { part: "statistics,contentDetails,status", id: chunk.join(",") });
		for (const v of data.items ?? []) {
			stats.set(v.id, {
				views: v.statistics?.viewCount !== undefined ? Number(v.statistics.viewCount) : undefined,
				duration: isoSeconds(v.contentDetails?.duration),
				isPublic: v.status?.privacyStatus === "public",
			});
		}
	}

	const videos = [];
	const shorts = [];
	let guessed = 0;
	for (const u of uploads) {
		const s = stats.get(u.id);
		if (!s?.isPublic) continue;
		const item = { id: u.id, title: u.title, publishedAt: u.publishedAt, views: s.views, duration: s.duration };
		let isShort;
		if (longIds?.has(u.id)) isShort = false;
		else if (shortIds?.has(u.id)) isShort = true;
		else {
			guessed++;
			isShort = s.duration !== undefined && s.duration <= SHORT_MAX_SECONDS;
		}
		(isShort ? shorts : videos).push(item);
	}
	if (videos.length + shorts.length === 0) throw new Error("YouTube returned no public videos, keeping the old data");
	log(`${videos.length} videos, ${shorts.length} shorts (${guessed} told apart by length because they were not in UULF/UUSH)`);

	// Playlists: used to give new videos a category (see src/data/videos.ts).
	const playlists = [];
	try {
		const list = [];
		let pageToken;
		do {
			const data = await api("playlists", { part: "snippet", channelId, maxResults: 50, ...(pageToken ? { pageToken } : {}) });
			list.push(...(data.items ?? []));
			pageToken = data.nextPageToken;
		} while (pageToken && list.length < MAX_PLAYLISTS);
		for (const p of list.slice(0, MAX_PLAYLISTS)) {
			const items = await playlistItems(p.id).catch(() => []);
			if (items.length) playlists.push({ name: p.snippet?.title ?? "", ids: items.map((i) => i.id) });
		}
		log(`${playlists.length} playlists read`);
	} catch (e) {
		log(`playlists skipped: ${e.message}`);
	}

	const sortNewest = (a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
	videos.sort(sortNewest);
	shorts.sort(sortNewest);

	await fs.mkdir(path.dirname(OUT), { recursive: true });
	const tmp = `${OUT}.tmp`;
	await fs.writeFile(tmp, JSON.stringify({ fetchedAt: new Date().toISOString(), channelId, videos, shorts, playlists }));
	await fs.rename(tmp, OUT);
	log(`saved ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => {
	// Never fail the build because of YouTube: the site falls back to the last saved data.
	warn(`${e.message}. The site will use the last saved data or the hand-written lists.`);
});
