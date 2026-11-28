#!/usr/bin/env node
/**
 * Prints the category whose slot falls on a given Philippine date. Used by the auto-guide workflow so the
 * weekly schedule lives in ONE place: automation/config.json (`day` 1=Mon..7=Sun, `time` HH:MM Philippine time).
 *
 *   node scripts/pick-category.mjs 2026-11-29 first    earliest slot of that day (DITO, 09:00)
 *   node scripts/pick-category.mjs 2026-11-29 last     latest slot of that day (More Internet Providers, 12:00)
 */
import fs from "node:fs";

const [date, which = "last"] = process.argv.slice(2);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
	console.error("Usage: pick-category.mjs YYYY-MM-DD [first|last]");
	process.exit(1);
}
const weekday = ((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7) + 1; // 1=Mon .. 7=Sun
const config = JSON.parse(fs.readFileSync("automation/config.json", "utf8"));
const hits = Object.entries(config)
	.filter(([, c]) => c.day === weekday)
	.sort((a, b) => String(a[1].time).localeCompare(String(b[1].time)));
if (!hits.length) {
	console.error(`No category is scheduled for weekday ${weekday} (${date}).`);
	process.exit(1);
}
console.log((which === "first" ? hits[0] : hits.at(-1))[0]);
