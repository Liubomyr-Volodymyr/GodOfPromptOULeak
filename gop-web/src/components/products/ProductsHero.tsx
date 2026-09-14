"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight, Check, Crown } from "lucide-react";
import CtaButton from "@/components/ui/CtaButton";
import CheckoutButton from "./CheckoutButton";
import type { Product } from "@/lib/api";

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

/** Fallback destination when a product has no Stripe id to charge against.
 *  `checkoutUrl` is deliberately absent — that domain no longer resolves. */
function destination(product: Product): string | undefined {
  return product.landingUrl ?? product.notionUrl ?? undefined;
}

function Price({ product, featured = false }: { product: Product; featured?: boolean }) {
  if (product.fullPrice == null && product.lifetimePrice == null) return null;

  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-1" aria-label="Product price">
      {product.fullPrice != null && product.fullPrice !== product.lifetimePrice && (
        <del
          className={`font-mono font-semibold leading-none ${
            featured ? "text-[27px] text-white/85" : "text-[20px] text-white/40"
          }`}
        >
          {money(product.fullPrice)}
        </del>
      )}
      {product.lifetimePrice != null && (
        <>
          {product.fullPrice != null && product.fullPrice !== product.lifetimePrice && (
            <ArrowRight size={18} className="mb-1 text-white/45" aria-hidden />
          )}
          <span
            className={`font-mono font-semibold leading-none text-white ${
              featured ? "text-[34px]" : "text-[30px]"
            }`}
          >
            {money(product.lifetimePrice)}
          </span>
          <span className="mb-0.5 text-[11px] text-white/50">/Lifetime</span>
        </>
      )}
    </div>
  );
}

function ProductPlanCard({
  product,
  featured = false,
}: {
  product: Product;
  featured?: boolean;
}) {
  const href = destination(product);

  return (
    <article
      className={`relative flex min-h-[570px] flex-col overflow-hidden rounded-[24px] ring-1 ring-inset p-6 shadow-[0_24px_50px_-28px_rgba(0,0,0,0.9)] ${
        featured
          ? "ring-white/15 bg-gop-card"
          : "ring-white/10 bg-white/[0.07]"
      }`}
    >
      {featured && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-[radial-gradient(circle_at_18%_0%,var(--color-gop-gold-tint),transparent_66%)]"
        />
      )}

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium ${
              featured ? "bg-gop-gold text-gop-ink" : "bg-white/10 text-white/75"
            }`}
          >
            {featured && <Crown size={14} aria-hidden />}
            {featured ? "Premium" : product.type === "addon" ? "Toolkit" : "Product"}
          </span>
        </div>

        <h2
          className={`m-0 mt-6 font-semibold leading-[1.08] tracking-[-0.025em] text-white ${
            featured ? "text-[32px]" : "text-[24px]"
          }`}
        >
          {product.name}
        </h2>
        {product.description && (
          <p className="m-0 mt-3 line-clamp-3 text-[14px] leading-6 text-white/60">
            {product.description}
          </p>
        )}

        <div className="mt-7">
          <Price product={product} featured={featured} />
        </div>

        {product.notionUrl && (
          <p className="m-0 mt-4 text-[13px] text-white/45">Delivered via Notion</p>
        )}

        <div className="mt-6">
          {product.stripeProductId || href ? (
            <CheckoutButton
              variant={featured ? "gold" : "ghost"}
              size="md"
              productId={product.stripeProductId}
              href={href}
              className="w-full"
            >
              Get Lifetime Access
            </CheckoutButton>
          ) : (
            <CtaButton variant="ghost" size="md" disabled className="w-full">
              Coming soon
            </CtaButton>
          )}
        </div>

        {product.features.length > 0 && (
          <ul className="m-0 mt-7 flex list-none flex-col gap-3 border-t border-white/10 pt-6">
            {product.features.slice(0, featured ? 6 : 4).map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2.5 text-[13px] leading-5 text-white/70"
              >
                <Check size={15} className="mt-0.5 shrink-0 text-white/65" aria-hidden />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export default function ProductsHero({
  featured,
  plans,
}: {
  featured: Product | null;
  plans: Product[];
}) {
  const rail = useRef<HTMLDivElement>(null);

  function move(direction: -1 | 1) {
    rail.current?.scrollBy({ left: direction * 356, behavior: "smooth" });
  }

  return (
    <section className="mx-auto w-full max-w-[1376px] px-6 pt-7 max-[640px]:px-4">
      <div
        data-dots-frame
        className="relative isolate overflow-hidden rounded-[48px] bg-gop-menu-bg px-[clamp(20px,4vw,64px)] pb-[clamp(36px,6vw,88px)] pt-[clamp(56px,7vw,96px)] text-white shadow-[0_28px_80px_-48px_rgba(0,0,0,0.8)] max-[640px]:rounded-[30px]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_48%,var(--color-gop-gold-tint),transparent_34%),radial-gradient(circle_at_70%_38%,rgba(255,255,255,0.06)_0_1px,transparent_1.5px)] bg-[length:auto,34px_34px]"
        />

        <header className="mx-auto max-w-[720px] text-center">
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-[13px] text-white/70">
            Products
          </span>
          <h1 className="m-0 mt-5 text-[clamp(34px,4.4vw,52px)] font-semibold leading-[1.08] tracking-[-0.035em] text-white">
            One Bundle. Infinite Superpowers.
          </h1>
          <p className="mx-auto mb-0 mt-4 max-w-[560px] text-[16px] leading-6 text-white/55">
            Get the complete bundle or choose the individual toolkit that fits your workflow.
          </p>
        </header>

        {(featured || plans.length > 0) && (
          <div className="relative mt-12">
            <div className="grid items-stretch gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
              {featured && <ProductPlanCard product={featured} featured />}

              {plans.length > 0 && (
                <div className="min-w-0">
                  <div
                    ref={rail}
                    className="grid snap-x snap-mandatory grid-flow-col auto-cols-[min(340px,86vw)] gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    aria-label="Individual product plans"
                  >
                    {plans.map((product) => (
                      <div key={product.slug} className="snap-start">
                        <ProductPlanCard product={product} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 hidden justify-end gap-2 lg:flex">
                    <button
                      type="button"
                      onClick={() => move(-1)}
                      aria-label="Previous product"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition-colors hover:bg-white/10"
                    >
                      <ArrowLeft size={18} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(1)}
                      aria-label="Next product"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition-colors hover:bg-white/10"
                    >
                      <ArrowRight size={18} aria-hidden />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
