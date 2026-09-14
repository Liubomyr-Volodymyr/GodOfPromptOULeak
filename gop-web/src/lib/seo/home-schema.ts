/**
 * Homepage JSON-LD. The homepage is the entity anchor for the whole site, so
 * the schema here grounds the brand for Google + AI engines.
 *
 * Emitted: Organization (with founder Person), WebSite + SearchAction,
 * ItemList (the category grid), and Product+Offer for the bundle — the last
 * ONLY when a real price is set (never ship a fabricated price/rating).
 */
import { SITE, BUNDLE } from "@/lib/home";
import type { Category } from "@/lib/categories";

type Json = Record<string, unknown>;

export function buildHomeJsonLd(categories: Category[]): Json[] {
  const org: Json = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    url: `${SITE.url}/`,
    logo: `${SITE.url}/images/brand/gop-logo.svg`,
    description:
      "An AI prompt library of engineered, copy-and-paste prompts for ChatGPT, Claude, Gemini, and every major model.",
    sameAs: SITE.socials,
    founder: {
      "@type": "Person",
      name: SITE.founder,
      sameAs: [SITE.founderX],
    },
  };

  const website: Json = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    url: `${SITE.url}/`,
    name: SITE.name,
    publisher: { "@id": `${SITE.url}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/prompt-library?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const itemList: Json = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Browse AI prompts by category",
    itemListElement: categories.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${c.name} AI Prompts`,
      url: `${SITE.url}/prompt-library/category/${c.slug}`,
    })),
  };

  const blocks = [org, website, itemList];

  // Product + Offer — only with a real price (honesty rule).
  if (BUNDLE.price != null && BUNDLE.price > 0) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "Product",
      name: BUNDLE.name,
      description: BUNDLE.description,
      brand: { "@type": "Brand", name: SITE.name },
      url: `${SITE.url}${BUNDLE.href}`,
      offers: {
        "@type": "Offer",
        price: BUNDLE.price,
        priceCurrency: BUNDLE.priceCurrency,
        availability: "https://schema.org/InStock",
        url: `${SITE.url}${BUNDLE.href}`,
      },
    });
  }

  return blocks;
}
