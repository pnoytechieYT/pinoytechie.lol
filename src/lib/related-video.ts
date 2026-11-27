import { videos, type Video } from "@/data/videos";

/**
 * Picks the YouTube video to show at the end of a guide.
 *  1. A guide can choose its own with `video: "<YouTube id>"` in the frontmatter. That always wins.
 *  2. Otherwise we only auto-match when it is clearly the same topic: the video must share a provider name
 *     (MariBank, DITO, Globe...) AND at least three topic words with the guide. No match = no video, which beats a wrong one.
 */
const STOP = new Set(
	"the and for with your you our are was was how what why who when where which this that these those from into onto about vs versus not can will just more most much very new best top step steps guide guides complete honest review test tutorial paano para ang mga sa ng kung ito yan lang may mo ko ba na pa din rin ay".split(" "),
);
const BRANDS = new Set(
	"maribank mari seabank gcash maya paymaya dito globe smart tnt sun pldt gotyme tonik cimb uno bpi bdo unionbank metrobank starlink converge".split(" "),
);

const tokens = (text: string) => new Set((text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => w.length >= 3 && !STOP.has(w)));

export function relatedVideo(post: { title: string; tags: string[]; video?: string }): Pick<Video, "id" | "title" | "si"> | undefined {
	if (post.video) {
		const own = videos.find((v) => v.id === post.video);
		return own ?? { id: post.video, title: post.title };
	}
	const want = tokens(`${post.title} ${post.tags.join(" ")}`);
	const brands = [...want].filter((w) => BRANDS.has(w));
	if (!brands.length) return undefined;
	let best: { video: Video; score: number } | undefined;
	for (const video of videos) {
		const have = tokens(`${video.title} ${video.description ?? ""}`);
		if (!brands.some((b) => have.has(b))) continue;
		const score = [...want].filter((w) => !BRANDS.has(w) && have.has(w)).length;
		if (score < 3) continue;
		if (!best || score > best.score || (score === best.score && (video.views ?? 0) > (best.video.views ?? 0))) best = { video, score };
	}
	return best?.video;
}
