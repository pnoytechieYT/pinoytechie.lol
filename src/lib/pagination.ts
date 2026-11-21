export interface Page<T> {
	items: T[];
	page: number;
	totalPages: number;
	total: number;
	/** 1-based position of the first / last item on this page */
	from: number;
	to: number;
}

export function totalPagesOf(total: number, perPage: number): number {
	return Math.max(1, Math.ceil(total / perPage));
}

export function paginate<T>(all: T[], page: number, perPage: number): Page<T> {
	const totalPages = totalPagesOf(all.length, perPage);
	const current = Math.min(Math.max(1, page), totalPages);
	const start = (current - 1) * perPage;
	const items = all.slice(start, start + perPage);
	return {
		items,
		page: current,
		totalPages,
		total: all.length,
		from: all.length ? start + 1 : 0,
		to: start + items.length,
	};
}

/** Page numbers for static routes: 2..N (page 1 lives at the base path) */
export function extraPageParams(total: number, perPage: number): { page: string }[] {
	return Array.from({ length: totalPagesOf(total, perPage) - 1 }, (_, i) => ({ page: String(i + 2) }));
}

/** URL of page n under a base path like "/blog/" or "/blog/category/maribank/" */
export function pageUrl(base: string, n: number): string {
	return n <= 1 ? base : `${base}page/${n}/`;
}

/** [1, "…", 4, 5, 6, "…", 12]: compact list of page links */
export function pageWindow(current: number, total: number): (number | "…")[] {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
	const set = new Set([1, total, current - 1, current, current + 1]);
	if (current <= 3) [2, 3, 4].forEach((n) => set.add(n));
	if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((n) => set.add(n));
	const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
	const out: (number | "…")[] = [];
	nums.forEach((n, i) => {
		if (i > 0 && n - nums[i - 1] > 1) out.push("…");
		out.push(n);
	});
	return out;
}
