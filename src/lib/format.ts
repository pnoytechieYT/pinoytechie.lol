/**
 * Short view-count labels, the way YouTube writes them:
 *   1689415 -> "1.6M"   (cut, never rounded up)
 *   999999  -> "999K"
 *   12345   -> "12K"
 *   2300    -> "2.3K"
 *   850     -> "850"
 * Accepts a number (1689415) or text with commas ("1,689,415").
 */
export function parseCount(value: number | string | undefined): number | undefined {
	if (value === undefined || value === "") return undefined;
	const n = typeof value === "number" ? value : Number(String(value).replace(/[\s,]/g, ""));
	return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

export function formatCount(n: number): string {
	const units: [number, string][] = [
		[1e9, "B"],
		[1e6, "M"],
		[1e3, "K"],
	];
	for (const [size, suffix] of units) {
		if (n >= size) {
			// under 10 keeps one decimal (1.6M), 10 and up shows whole numbers (12M)
			const cut = n < size * 10 ? Math.floor(n / (size / 10)) / 10 : Math.floor(n / size);
			return `${cut}${suffix}`;
		}
	}
	return String(n);
}
