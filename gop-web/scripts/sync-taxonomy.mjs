/**
 * Regenerates src/content/seo/taxonomy.json — the library's category tree.
 *
 *   pnpm sync:taxonomy
 *
 * WHY THIS SCRIPT EXISTS
 * ----------------------
 * `GET /api/library/categories` returns a FLAT list (184 rows) with no parent
 * field, so the payload alone cannot tell a root category from one of its
 * subcategories. The old answer was a mirrored `categories.json` snapshot from
 * gop-seo, which drifted: it listed 199 rows including slugs the API no longer
 * serves, while missing live ones (`financial-modeling` 404'd), and it hardcoded
 * three categories as empty that now carry prompts.
 *
 * The prompt feed does know the hierarchy, and the two filters are disjoint:
 *
 *   categorySlug=finance               -> 318   (roots only)
 *   categorySlug=financial-modeling    ->   0   (never matches a subcategory)
 *   subCategorySlug=financial-modeling ->  22   + category.slug: "finance"
 *
 * So one `subCategorySlug` probe per slug yields all three facts at once: is it
 * a subcategory, how many prompts it has, and who its parent is. Slugs that
 * come back empty get a second `categorySlug` probe to confirm they're roots.
 *
 * WHY A COMMITTED SNAPSHOT RATHER THAN A RUNTIME FETCH
 * ---------------------------------------------------
 * This is ~225 requests against a backend that rate-limits at ~100/50s. That is
 * fine once a day in CI, and unacceptable inside `generateStaticParams`, which
 * runs per route during the build and must be fast and deterministic. Pages read
 * live prompt data at request time; only the SHAPE of the tree is snapshotted.
 *
 * Re-run whenever the backend adds categories, tools or output types. The output
 * is deterministic (sorted), so an unchanged taxonomy produces an empty diff.
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const API = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-dev.godofprompt.dev").replace(/\/+$/, "");
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "content", "seo", "taxonomy.json");

/** Backend rate limit is ~100 requests / 50s. Stay well under it. */
const GAP_MS = 400;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path) {
  const res = await fetch(`${API}${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

const rows = (json) => (Array.isArray(json) ? json : (json?.data ?? json?.items ?? []));

/** meta.total + the first item, for one filtered feed query. */
async function probe(param, slug) {
  const json = await api(`/api/library/prompts?limit=1&${param}=${encodeURIComponent(slug)}`);
  return { total: json?.meta?.total ?? 0, item: json?.data?.[0] ?? null };
}

async function main() {
  const [cats, tools, auds] = await Promise.all([
    api("/api/library/categories?limit=500").then(rows),
    api("/api/library/tools?limit=500").then(rows),
    api("/api/library/audience-types?limit=500").then(rows),
  ]);
  console.log(`taxonomy: ${cats.length} category rows, ${tools.length} tools, ${auds.length} audiences`);

  const roots = [];
  const subs = [];

  for (const c of cats) {
    const slug = String(c.slug ?? "").trim();
    const name = String(c.name ?? "").trim();
    if (!slug || !name) continue;

    // One probe answers "is this a subcategory, how big, and whose child?"
    const asSub = await probe("subCategorySlug", slug);
    await sleep(GAP_MS);
    if (asSub.total > 0) {
      const parent = asSub.item?.category?.slug ?? null;
      if (!parent) {
        console.warn(`  ! ${slug}: ${asSub.total} prompts but no parent on the sample — skipped`);
        continue;
      }
      // `ai-agents` is filed as its OWN parent: the backend uses one row for
      // both the category and the subcategory of its 2 prompts. A self-parented
      // term is a root, not a child of itself — otherwise the breadcrumb would
      // read "Prompts › AI Agents › AI Agents".
      if (parent === slug) roots.push({ slug, name, count: asSub.total });
      else subs.push({ slug, name, parent, count: asSub.total });
      continue;
    }

    // Not a subcategory (or empty) — is it a root with prompts?
    const asRoot = await probe("categorySlug", slug);
    await sleep(GAP_MS);
    if (asRoot.total > 0) roots.push({ slug, name, count: asRoot.total });
    // Zero on both axes = a term with no prompts. Deliberately omitted: an
    // entry here becomes a minted page, and empty pages are the bug we're fixing.
  }

  const toolList = [];
  for (const t of tools) {
    const slug = String(t.slug ?? "").trim();
    const name = String(t.name ?? "").trim();
    if (!slug || !name) continue;
    const { total } = await probe("tools", slug);
    await sleep(GAP_MS);
    if (total > 0) toolList.push({ slug, name, count: total });
  }

  const audList = [];
  for (const a of auds) {
    const slug = String(a.slug ?? "").trim();
    const name = String(a.name ?? "").trim();
    if (!slug || !name) continue;
    const { total } = await probe("audienceTypeSlug", slug);
    await sleep(GAP_MS);
    if (total > 0) audList.push({ slug, name, count: total });
  }

  // Output types come off the same feed: output_type is a scalar on every row.
  const types = [];
  for (const slug of ["text", "image", "code", "presentation", "video", "audio"]) {
    const json = await api(`/api/library/prompts?limit=1&output_type=${slug}`);
    await sleep(GAP_MS);
    const total = json?.meta?.total ?? 0;
    if (total > 0) types.push({ slug, name: slug[0].toUpperCase() + slug.slice(1), count: total });
  }

  const byCount = (a, b) => b.count - a.count || a.slug.localeCompare(b.slug);
  const snapshot = {
    generatedFrom: API,
    totalPrompts: (await api("/api/library/prompts?limit=1"))?.meta?.total ?? null,
    roots: roots.sort(byCount),
    subcategories: subs.sort(byCount),
    tools: toolList.sort(byCount),
    audiences: audList.sort(byCount),
    outputTypes: types.sort(byCount),
  };

  await writeFile(OUT, JSON.stringify(snapshot, null, 2) + "\n");
  const orphans = subs.filter((s) => !roots.some((r) => r.slug === s.parent));
  console.log(
    `\nwrote ${OUT}\n` +
      `  roots ${roots.length} · subcategories ${subs.length} · tools ${toolList.length} · ` +
      `audiences ${audList.length} · output types ${types.length}`,
  );
  if (orphans.length) console.warn(`  ! ${orphans.length} subcategories whose parent has no prompts: ${orphans.map((o) => o.slug).join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
