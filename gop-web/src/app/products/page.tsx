import { OG_IMAGE } from "@/lib/seo/robots";
import type { Metadata } from "next";
import { getProducts, type Product } from "@/lib/api";
import ProductsHero from "@/components/products/ProductsHero";
import ProductsBenefits from "@/components/products/ProductsBenefits";
import AiTimeline from "@/components/home/AiTimeline";
import BundleConstellation from "@/components/home/BundleConstellation";
import Testimonials from "@/components/home/Testimonials";
import NewsletterCard from "@/components/marketing/NewsletterCard";
import ProductsFaq from "@/components/products/ProductsFaq";
import { SITE_ORIGIN } from "@/lib/seo/site";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "AI Products, Guides and Toolkits",
  description:
    "Explore God of Prompt AI products, guides, prompt toolkits and automation resources, including the Complete AI Bundle.",
  alternates: { canonical: "/products" },
  openGraph: {
    images: [OG_IMAGE],
    title: "AI Products, Guides and Toolkits — God of Prompt",
    description:
      "Explore the Complete AI Bundle and the current God of Prompt product catalogue.",
    url: `${SITE_ORIGIN}/products`,
    type: "website",
  },
};

// Discontinued products must never surface anywhere on the site (matches the
// AiTimeline exclusion). Filtered from the real products API by name.
const DISCONTINUED = new Set(["Text Prompts Bundle", "Image Prompts Bundle"]);

function bySlug(products: Product[], slug: string): Product | null {
  return products.find((product) => product.slug === slug) ?? null;
}

/** Canonical public URL for a product. Never `checkoutUrl` — that domain is
 *  dead (see lib/api/products.ts). */
function productUrl(product: Product): string | null {
  return product.landingUrl ?? product.notionUrl;
}

export default async function ProductsPage() {
  const products = (await getProducts(1800)).filter(
    (product) => product.status === "published" && !DISCONTINUED.has(product.name ?? ""),
  );
  const bundle = bySlug(products, "complete-ai-bundle");
  const automation = bySlug(products, "n8n-automations-bundle");
  const expertise = bySlug(products, "claude-skills-pack");

  const plans = products
    .filter(
      (product) =>
        product.type === "addon" &&
        // A product is buyable when Stripe knows it, not when the (dead)
        // checkoutUrl is set.
        product.stripeProductId &&
        product.lifetimePrice != null &&
        product.slug !== bundle?.slug,
    )
    .sort((a, b) => (b.lifetimePrice ?? 0) - (a.lifetimePrice ?? 0));

  // JSON-LD is built from the exact products shown on the page (the bundle +
  // every real paid toolkit from the API) — no hardcoded catalogue.
  const listed = [bundle, ...plans].filter((p): p is Product => p !== null);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "God of Prompt product catalogue",
    itemListElement: listed.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        ...(product.description ? { description: product.description } : {}),
        ...(productUrl(product) ? { url: productUrl(product) } : {}),
        brand: { "@type": "Brand", name: "God of Prompt" },
        ...(product.lifetimePrice != null
          ? {
              offers: {
                "@type": "Offer",
                price: product.lifetimePrice,
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
                ...(productUrl(product) ? { url: productUrl(product) as string } : {}),
              },
            }
          : {}),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />

      <ProductsHero featured={bundle} plans={plans} />
      <ProductsBenefits bundle={bundle} automation={automation} expertise={expertise} />
      <AiTimeline showArtwork />
      <BundleConstellation />
      <Testimonials />

      <section
        aria-label="Newsletter"
        className="mx-auto w-full max-w-[1280px] px-6 py-14 max-[640px]:px-4 max-[640px]:py-9"
      >
        <NewsletterCard source="products-page" />
      </section>

      <ProductsFaq />
    </>
  );
}
