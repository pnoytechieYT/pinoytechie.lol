/**
 * Markdown plugins for src/posts/<category>/<slug>.md
 *
 * remarkStripCitations  removes leftover "[citation:7]" tags pasted from AI/research tools
 * rehypeCallouts        > [!NOTE] / [!TIP] / [!WARNING] / [!IMPORTANT] / [!CAUTION] / [!INFO] / [!EXAMPLE]
 * rehypeTables          wraps tables in a horizontally scrollable box
 * rehypeFigures         ![alt](src "caption") becomes <figure> with a caption
 * rehypeHeadingAnchors  adds a # link to h2-h4 so a section can be linked directly
 * rehypeExternalLinks   external links open in a new tab with safe rel attributes
 * rehypeCodeBlocks      wraps code blocks with a language label (copy button is added in the post page)
 */
import Slugger from "github-slugger";
import { visit } from "unist-util-visit";

const el = (tagName, properties = {}, children = []) => ({ type: "element", tagName, properties, children });
const text = (value) => ({ type: "text", value });
const cls = (node) => [].concat(node.properties?.className ?? []);

export function remarkStripCitations() {
	const re = /[ \t]*\[(?:citation|cite|source)[:\s]\s*\d+(?:\s*,\s*\d+)*\]/gi;
	return (tree) => {
		visit(tree, (node) => {
			if ((node.type === "text" || node.type === "html") && typeof node.value === "string") {
				node.value = node.value.replace(re, "");
			}
		});
	};
}

const CALLOUTS = {
	note: { label: "Note", icon: "ℹ️" },
	info: { label: "Info", icon: "ℹ️" },
	tip: { label: "Tip", icon: "💡" },
	important: { label: "Important", icon: "⭐" },
	warning: { label: "Warning", icon: "⚠️" },
	caution: { label: "Caution", icon: "🛑" },
	example: { label: "Example", icon: "🧮" },
	quote: { label: "Quote", icon: "❝" },
};

export function rehypeCallouts() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName !== "blockquote") return;
			const firstP = node.children.find((c) => c.type === "element");
			if (!firstP || firstP.tagName !== "p") return;
			const first = firstP.children[0];
			if (!first || first.type !== "text") return;
			const m = first.value.match(/^\s*\[!(\w+)\][ \t]*(.*?)(\r?\n|$)/);
			if (!m) return;
			const kind = m[1].toLowerCase();
			const def = CALLOUTS[kind];
			if (!def) return;

			first.value = first.value.slice(m[0].length);
			if (!first.value) firstP.children.shift();
			// "<br>" left behind after the marker line
			if (firstP.children[0]?.type === "element" && firstP.children[0].tagName === "br") firstP.children.shift();
			const body = node.children.filter((c) => !(c.type === "element" && c.tagName === "p" && c.children.length === 0));
			const title = m[2].trim() || def.label;

			node.properties = { ...node.properties, className: ["callout", `callout-${kind}`], role: "note" };
			node.children = [
				el("p", { className: ["callout-title"] }, [
					el("span", { className: ["callout-icon"], "aria-hidden": "true" }, [text(def.icon)]),
					text(title),
				]),
				...body,
			];
		});
	};
}

export function rehypeTables() {
	return (tree) => {
		visit(tree, "element", (node, index, parent) => {
			if (node.tagName !== "table" || !parent || parent.properties?.className?.includes?.("table-wrap")) return;
			parent.children[index] = el("div", { className: ["table-wrap"], tabindex: 0, role: "region", "aria-label": "Table, scrolls sideways on small screens" }, [node]);
			return "skip";
		});
	};
}

export function rehypeFigures() {
	return (tree) => {
		visit(tree, "element", (node, index, parent) => {
			if (node.tagName !== "p" || !parent || node.children.length !== 1) return;
			const img = node.children[0];
			if (img.type !== "element" || img.tagName !== "img" || !img.properties?.title) return;
			const caption = img.properties.title;
			delete img.properties.title;
			img.properties.loading = "lazy";
			img.properties.decoding = "async";
			parent.children[index] = el("figure", {}, [img, el("figcaption", {}, [text(caption)])]);
		});
	};
}

export function rehypeHeadingAnchors() {
	// Astro adds heading ids AFTER user plugins, so ids are created here with the same
	// algorithm (github-slugger). Astro keeps existing ids, so the table of contents matches.
	// The "#" is drawn by CSS (empty link) so it never leaks into the heading text / TOC.
	const textOf = (n) => (n.type === "text" ? n.value : (n.children ?? []).map(textOf).join(""));
	return (tree) => {
		const slugger = new Slugger();
		visit(tree, "element", (node) => {
			if (!/^h[1-6]$/.test(node.tagName)) return;
			node.properties ??= {};
			if (typeof node.properties.id !== "string") node.properties.id = slugger.slug(textOf(node));
			if (!/^h[2-4]$/.test(node.tagName) || cls(node).includes("sr-only")) return;
			node.children.push(
				el("a", { href: `#${node.properties.id}`, className: ["heading-anchor"], "aria-label": "Link to this section" }),
			);
		});
	};
}

export function rehypeExternalLinks() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName !== "a") return;
			const href = String(node.properties?.href ?? "");
			if (/^https?:\/\//i.test(href) && !href.startsWith("https://pinoytechie.lol")) {
				node.properties.target = "_blank";
				node.properties.rel = ["noopener", "noreferrer", "nofollow"];
				node.properties.className = [...cls(node), "external"];
			}
		});
	};
}

export function rehypeCodeBlocks() {
	return (tree) => {
		visit(tree, "element", (node, index, parent) => {
			if (node.tagName !== "pre" || !parent || cls(parent).includes("code-block")) return;
			const lang = (node.properties?.dataLanguage ?? "").toString();
			const label = lang && lang !== "plaintext" && lang !== "text" ? lang : "";
			parent.children[index] = el("div", { className: ["code-block"] }, [
				el("div", { className: ["code-bar"] }, [
					el("span", { className: ["code-lang"] }, [text(label || "code")]),
					el("button", { type: "button", className: ["code-copy"], "data-copy-code": "" }, [text("Copy")]),
				]),
				node,
			]);
			return "skip";
		});
	};
}
