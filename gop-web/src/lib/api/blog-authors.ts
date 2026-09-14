import { WP_API, decodeEntities } from "./blog";

/**
 * Blog authors — the WordPress `users` collection (the blog's native authors
 * table; NO separate collection needed). Real data only: name, slug, the
 * long-form bio (profile description, light HTML), the profile website, and
 * the Person `sameAs` social links from the user's Yoast schema graph.
 *
 * Rides the same cutover as lib/api/blog.ts: when the api-dev blog mirror
 * ships authors, this client repoints (the mirror has no author routes yet).
 */

export type BlogAuthor = {
  id: number;
  slug: string;
  name: string;
  /** Long-form profile bio — light HTML (p/strong/a), sanitize at render. */
  bioHtml: string;
  /** Profile website (e.g. prompt-copilot.ai) or null. */
  website: string | null;
  /** REAL personal social links from the Yoast Person schema (normalized). */
  sameAs: string[];
};

type WpUser = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  url?: string;
  yoast_head_json?: { schema?: { "@graph"?: Array<Record<string, unknown>> } };
};

/** The WP profile stores handles-as-URLs inconsistently — e.g.
 *  "https://x.com/https://x.com/rryssf". Keep the LAST full URL. */
function normalizeUrl(u: string): string | null {
  const parts = u.split(/(?=https?:\/\/)/g);
  const last = parts[parts.length - 1]?.trim();
  try {
    return new URL(last).toString();
  } catch {
    return null;
  }
}

/** Person-node sameAs from the user's Yoast schema graph (their PERSONAL
 *  links — the Organization node carries the brand accounts, skip those). */
function personSameAs(user: WpUser): string[] {
  const graph = user.yoast_head_json?.schema?.["@graph"] ?? [];
  const person = graph.find((n) => {
    const t = n["@type"];
    return t === "Person" || (Array.isArray(t) && t.includes("Person"));
  });
  const raw = (person?.sameAs as string[] | undefined) ?? [];
  return raw
    .map(normalizeUrl)
    .filter((u): u is string => !!u)
    .filter((u, i, arr) => arr.indexOf(u) === i);
}

function toAuthor(u: WpUser): BlogAuthor {
  return {
    id: u.id,
    slug: u.slug,
    name: decodeEntities(u.name),
    bioHtml: u.description ?? "",
    website: u.url?.trim() || null,
    sameAs: personSameAs(u),
  };
}

/** All blog authors. Cached 1h; [] on failure (page renders notFound). */
export async function getBlogAuthors(): Promise<BlogAuthor[]> {
  try {
    const res = await fetch(`${WP_API}/users?per_page=100`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const users = (await res.json()) as WpUser[];
    return users.map(toAuthor);
  } catch {
    return [];
  }
}

export async function getBlogAuthorBySlug(slug: string): Promise<BlogAuthor | null> {
  const all = await getBlogAuthors();
  return all.find((a) => a.slug === slug) ?? null;
}
