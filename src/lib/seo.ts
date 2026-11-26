import { siteData } from "@/data/site";

const { url, name } = siteData;

export const ids = {
	org: `${url}/#organization`,
	website: `${url}/#website`,
};

/** Absolute URL for a site path or an already-absolute URL. */
export function abs(pathOrUrl: string): string {
	return new URL(pathOrUrl, url).toString();
}

export function authorNode() {
	const { type, name: authorName, url: authorUrl } = siteData.author;
	return { "@type": type, name: authorName, url: abs(authorUrl) };
}

/** Sitewide nodes: Organization (with logo) and WebSite. Added to every page. */
export function baseGraph() {
	const sameAs = [siteData.social.youtube].filter(Boolean);
	return [
		{
			"@type": "Organization",
			"@id": ids.org,
			name,
			url: `${url}/`,
			description: siteData.description,
			logo: {
				"@type": "ImageObject",
				url: abs(siteData.logo.src),
				width: siteData.logo.width,
				height: siteData.logo.height,
			},
			image: abs(siteData.logo.src),
			...(sameAs.length ? { sameAs } : {}),
			...(siteData.social.email
				? { contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: siteData.social.email } }
				: {}),
		},
		{
			"@type": "WebSite",
			"@id": ids.website,
			url: `${url}/`,
			name,
			description: siteData.description,
			inLanguage: siteData.locale,
			publisher: { "@id": ids.org },
		},
	];
}

export interface Crumb {
	name: string;
	href: string;
	/** Small logo shown inside the box of the current (last) crumb */
	icon?: string;
}

export function breadcrumbNode(crumbs: Crumb[]) {
	return {
		"@type": "BreadcrumbList",
		itemListElement: crumbs.map((c, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: c.name,
			item: abs(c.href),
		})),
	};
}

export function webPageNode(opts: {
	type?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";
	path: string;
	title: string;
	description: string;
	dateModified?: string;
}) {
	const pageUrl = abs(opts.path);
	return {
		"@type": opts.type ?? "WebPage",
		"@id": `${pageUrl}#webpage`,
		url: pageUrl,
		name: opts.title,
		description: opts.description,
		inLanguage: siteData.locale,
		isPartOf: { "@id": ids.website },
		about: { "@id": ids.org },
		...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
	};
}

export function faqNode(faqs: { question: string; answer: string }[]) {
	return {
		"@type": "FAQPage",
		mainEntity: faqs.map((f) => ({
			"@type": "Question",
			name: f.question,
			acceptedAnswer: { "@type": "Answer", text: f.answer },
		})),
	};
}
