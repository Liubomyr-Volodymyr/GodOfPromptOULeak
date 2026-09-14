"use client";

import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import CtaButton from "@/components/ui/CtaButton";
import { startCheckout } from "@/lib/api/client";
import { captureTracking } from "@/lib/auth";

/**
 * The one control that starts a Stripe purchase.
 *
 * Posts the product's Stripe id to gop-back, which mints a Checkout session
 * and hands back a session URL we redirect to. Nothing about pricing lives in
 * the frontend — change a price in Stripe and this keeps working.
 *
 * It deliberately does NOT use the products API's `checkoutUrl`: those point
 * at checkout.godofprompt.ai, a custom payment-link domain that no longer has
 * a DNS record, so every one of them is a dead link.
 *
 * Falls back to `href` (a landing page) when the product carries no Stripe id
 * — a free lead-magnet, or a paid product the CMS hasn't finished wiring.
 */
export default function CheckoutButton({
  productId,
  href,
  children,
  variant = "gold",
  size = "md",
  className,
  iconAfter,
  iconBefore,
}: {
  productId?: string | null;
  /** Where to send the user when there's no Stripe id to charge against. */
  href?: string | null;
  children: React.ReactNode;
  variant?: "gold" | "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  iconAfter?: React.ReactNode;
  iconBefore?: React.ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = useCallback(async () => {
    if (pending || !productId) return;
    setPending(true);
    setError(null);
    try {
      await startCheckout({ productId, tracking: captureTracking() });
      // On success the browser navigates to Stripe and never gets here.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout unavailable");
      setPending(false);
    }
  }, [pending, productId]);

  if (!productId) {
    return (
      <CtaButton
        variant={variant}
        size={size}
        href={href ?? "/products"}
        className={className}
        iconAfter={iconAfter}
        iconBefore={iconBefore}
      >
        {children}
      </CtaButton>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1.5">
      <CtaButton
        variant={variant}
        size={size}
        onClick={onClick}
        disabled={pending}
        className={className}
        iconAfter={pending ? undefined : iconAfter}
        iconBefore={pending ? undefined : iconBefore}
      >
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden />
            Starting checkout…
          </>
        ) : (
          children
        )}
      </CtaButton>
      {/* A failed checkout must say so — never a button that silently does
          nothing. */}
      {error && (
        <span role="alert" className="text-[13px] leading-5 text-[#c0392b]">
          {error}
        </span>
      )}
    </span>
  );
}
