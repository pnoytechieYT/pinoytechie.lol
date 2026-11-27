import { STALE_AFTER_DAYS, WITHHOLDING_TAX, type RateProduct } from "@/data/rates";
import { daysSince, peso, percent, type Estimate } from "@/lib/interest";

/** HTML for one result row. Used at build time (so the table is in the page for Google) and again in the browser when the numbers change. */

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const dateFmt = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" });
export const formatAsOf = (asOf: string) => dateFmt.format(new Date(`${asOf}T00:00:00+08:00`));

export function rowHtml(p: RateProduct, est: Estimate | null, now: Date = new Date(), best = false): string {
	const age = daysSince(p.asOf, now);
	const stale = age > STALE_AFTER_DAYS;
	const sources = p.sources.map((s) => `<a href="${esc(s.url)}" rel="noopener noreferrer" target="_blank" class="underline hover:bg-sun">${esc(s.label)}</a>`).join("; ");
	const details = `
		<p>${esc(p.note)}</p>
		<p class="mt-1 text-xs text-muted">Checked ${esc(formatAsOf(p.asOf))}. Source: ${sources}. <a href="${esc(p.guide)}" class="font-bold text-flame-dark underline hover:bg-sun">Read our guide</a></p>
		${stale ? `<p class="mt-1 text-xs font-bold text-flame-dark">This rate was last checked ${age} days ago. Confirm it in the app before you rely on it.</p>` : ""}`;
	const numbers = est
		? `<td class="px-3 py-3 text-right font-bold tabular-nums">${percent(est.effectiveRate)}</td>
		   <td class="px-3 py-3 text-right tabular-nums">${peso(est.gross)}</td>
		   <td class="px-3 py-3 text-right tabular-nums text-muted">−${peso(est.tax)}</td>
		   <td class="px-3 py-3 text-right text-base font-bold tabular-nums ${best ? "bg-sun" : ""}">${peso(est.net)}</td>`
		: `<td colspan="4" class="px-3 py-3 text-sm font-bold text-muted">Not covered: this amount is outside the balances the rate applies to. Check the app.</td>`;
	return `<tr class="border-t-2 border-ink align-top ${p.bestCase ? "bg-sun-soft" : ""}">
		<th scope="row" class="px-3 py-3 text-left font-bold">
			${esc(p.name)}
			<span class="block text-xs font-medium text-muted">${esc(p.provider)}</span>
			${best ? `<span class="nb-tag mt-1 inline-block">Highest after tax</span>` : ""}
			${p.bestCase ? `<span class="nb-tag nb-tag-red mt-1 inline-block">Best case, not guaranteed</span>` : ""}
		</th>
		${numbers}
		<td class="min-w-64 px-3 py-3 text-sm">${details}</td>
	</tr>`;
}

export const taxPercent = WITHHOLDING_TAX * 100;
