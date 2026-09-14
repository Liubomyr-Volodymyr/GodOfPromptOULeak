import { getProductBySlug } from "@/lib/api";
import CheckoutButton from "@/components/products/CheckoutButton";

/**
 * BundleConstellation — "The Complete AI Bundle" convergence section
 * (Figma 2033:19522). One prebuilt convergence SVG (the lines + model tiles +
 * the white title plate, from gop-web-temp) fills the stage; the title, a
 * short tagline, and the CTA are REAL text OVERLAID inside the frame at the
 * design's own positions (title ~44%, copy ~60%, CTA ~87% of the stage), NOT
 * stacked below it — the whole section stays the design's ~2.9:1 height.
 *
 * Title + checkout come from the backend product; the tagline is the first
 * sentence of the product description (fits the tight copy slot). Under 640px
 * the overlay collapses to a normal centered stack.
 */
export default async function BundleConstellation() {
  const product = await getProductBySlug("complete-ai-bundle", 1800);
  if (!product) return null;

  const tagline = (product.description ?? "").split(/(?<=\.)\s+/)[0] || product.description || "";

  return (
    <section aria-label={product.name} className="mx-auto w-full max-w-[960px] px-4 py-8">
      <div className="relative mx-auto w-full min-[641px]:aspect-[998/408] max-[640px]:flex max-[640px]:flex-col max-[640px]:items-center max-[640px]:text-center">
        {/* Convergence art (lines + tiles + title plate) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/home/bundle-section-graphics.svg"
          alt=""
          width={998}
          height={408}
          loading="lazy"
          decoding="async"
          aria-hidden
          className="pointer-events-none block min-[641px]:absolute min-[641px]:inset-0 min-[641px]:h-full min-[641px]:w-full max-[640px]:order-2 max-[640px]:w-full"
        />

        {/* Mascot — floats above the plate */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/brand/face.svg"
          alt=""
          width={88}
          height={124}
          loading="lazy"
          decoding="async"
          aria-hidden
          className="min-[641px]:absolute min-[641px]:left-1/2 min-[641px]:top-[3%] min-[641px]:w-[7.5%] min-[641px]:-translate-x-1/2 max-[640px]:order-1 max-[640px]:mb-1 max-[640px]:w-14"
        />

        {/* Title — transparent text over the SVG's plate */}
        <h2 className="m-0 text-[clamp(20px,2.9vw,38px)] font-bold tracking-[-0.02em] text-gop-ink min-[641px]:absolute min-[641px]:left-1/2 min-[641px]:top-[44%] min-[641px]:-translate-x-1/2 min-[641px]:-translate-y-1/2 min-[641px]:whitespace-nowrap max-[640px]:order-3 max-[640px]:mt-3">
          {product.name}
        </h2>

        {/* Tagline */}
        {tagline && (
          <p className="text-[15px] leading-[1.5] text-gop-ink/60 min-[641px]:absolute min-[641px]:left-1/2 min-[641px]:top-[58%] min-[641px]:w-[52%] min-[641px]:-translate-x-1/2 max-[640px]:order-4 max-[640px]:mt-2 max-[640px]:max-w-[46ch]">
            {tagline}
          </p>
        )}

        {/* CTA */}
        <div className="min-[641px]:absolute min-[641px]:left-1/2 min-[641px]:top-[84%] min-[641px]:-translate-x-1/2 max-[640px]:order-5 max-[640px]:mt-4">
          <CheckoutButton variant="gold" size="md" productId={product.stripeProductId} href="/products">
            Unlock Premium Bundle
          </CheckoutButton>
        </div>
      </div>
    </section>
  );
}
