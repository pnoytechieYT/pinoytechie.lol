import { WITHHOLDING_TAX, type RateProduct } from "@/data/rates";

/**
 * Savings-interest maths, shared by the page (build time) and the calculator (in the browser).
 * It is an ESTIMATE on a constant balance. Real banks credit interest daily or monthly and round differently.
 */

/** Interest in pesos for ONE YEAR at a constant balance, before tax. null = the balance is outside the product's bands. */
export function annualInterest(product: RateProduct, balance: number): number | null {
	if (product.mode === "band") {
		const band = product.tiers.find((t) => t.upTo === null || balance < t.upTo);
		return band ? (balance * band.rate) / 100 : null;
	}
	let total = 0;
	let from = 0;
	for (const tier of product.tiers) {
		const to = tier.upTo ?? Infinity;
		if (balance > from) total += ((Math.min(balance, to) - from) * tier.rate) / 100;
		from = to;
		if (balance <= to) break;
	}
	return total;
}

export interface Estimate {
	gross: number;
	tax: number;
	net: number;
	/** Average rate actually earned on the starting balance, % per year, before tax */
	effectiveRate: number;
}

/**
 * @param months   how long the money stays in
 * @param compound false: balance stays the same (simple interest). true: each month's interest, after tax, is added to the balance.
 */
export function estimate(product: RateProduct, amount: number, months: number, compound: boolean): Estimate | null {
	const yearly = annualInterest(product, amount);
	if (yearly === null) return null;
	let gross = 0;
	if (!compound) {
		gross = (yearly * months) / 12;
	} else {
		let balance = amount;
		for (let m = 0; m < months; m++) {
			const monthly = annualInterest(product, balance);
			if (monthly === null) return null;
			const g = monthly / 12;
			gross += g;
			balance += g * (1 - WITHHOLDING_TAX);
		}
	}
	const tax = gross * WITHHOLDING_TAX;
	return { gross, tax, net: gross - tax, effectiveRate: ((yearly / amount) * 100) };
}

export function peso(value: number): string {
	return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function percent(value: number): string {
	return `${value.toLocaleString("en-PH", { maximumFractionDigits: 4 })}%`;
}

/** Whole days between a YYYY-MM-DD date and `now` */
export function daysSince(asOf: string, now: Date = new Date()): number {
	const then = new Date(`${asOf}T00:00:00+08:00`).getTime();
	return Math.max(0, Math.floor((now.getTime() - then) / 86_400_000));
}
