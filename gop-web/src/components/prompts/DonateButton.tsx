/**
 * DonateButton — the gold circular "support" control in the prompt header
 * (Figma 1557:6259). A charity heart-with-coin glyph on the brand gold
 * chassis (--gop-gradient-gold token, white/40 hairline, glossy top sheen —
 * the same 516-3947 system the Generate CTA uses). Sits flush at the 32px
 * footprint of the sibling share/stat pills. Links out to the donation
 * page in a new tab.
 *
 * TODO(donation-url): DONATION_URL is a placeholder. Point it at the real
 * support / donation destination once confirmed.
 */
// TODO(donation-url): interim internal target (site home) so nothing links to
// the old prod site. Point at the real donation destination once confirmed.
const DONATION_URL = "/";

export default function DonateButton() {
  return (
    <a
      href={DONATION_URL}
      title="Support God of Prompt"
      aria-label="Support God of Prompt"
      style={{ background: "var(--gop-gradient-gold)" }}
      className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/40 text-gop-dark shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-[filter,transform] duration-150 ease-out hover:brightness-[1.04] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow"
    >
      {/* glossy top-edge sheen (Figma 516-3947 button system) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-2 h-4 bg-[radial-gradient(ellipse_80%_100%_at_50%_0%,rgba(255,255,255,0.6),transparent_70%)] blur-[4px]"
      />
      <CharityIcon />
    </a>
  );
}

/** Heart-with-coin charity mark — Figma node 1417:12573 (16×16). */
function CharityIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden className="relative">
      <path
        d="M11.9767 0.485291C10.0655 0.485291 8.9908 1.81035 8.4528 2.80795C7.91339 1.81082 6.8383 0.485291 4.93164 0.485291C2.65577 0.485291 0.939453 2.33092 0.939453 4.77879C0.939453 5.71732 1.22755 6.59726 1.80677 7.49788C2.40273 7.2237 3.05958 7.06063 3.75745 7.06063C6.34705 7.06063 8.45414 9.16773 8.45414 11.7573C8.45414 12.3249 8.33736 12.8624 8.15198 13.3666L8.45414 13.6282L8.76189 13.3617C9.52739 12.698 10.2484 12.0981 10.9162 11.5426C13.9585 9.01176 16.0001 7.33951 16.0001 4.77882C16.0001 2.33095 14.2525 0.485291 11.9767 0.485291Z"
        fill="currentColor"
      />
      <path
        d="M3.75734 8C1.68219 8 0 9.68219 0 11.7573C0 13.8324 1.68219 15.5147 3.75734 15.5147C5.8325 15.5147 7.51469 13.8324 7.51469 11.7573C7.51469 9.68219 5.8325 8 3.75734 8ZM3.75734 11.2877C4.53431 11.2877 5.16634 11.9197 5.16634 12.6967C5.16634 13.4737 4.53431 14.1057 3.75734 14.1057C2.98038 14.1057 2.34834 13.4736 2.34834 12.6967H3.28769C3.28769 12.9558 3.49822 13.1663 3.75734 13.1663C4.01647 13.1663 4.227 12.9558 4.227 12.6967C4.227 12.4376 4.01647 12.227 3.75734 12.227C2.98038 12.227 2.34834 11.595 2.34834 10.818C2.34834 10.0411 2.98038 9.40903 3.75734 9.40903C4.53431 9.40903 5.16634 10.0411 5.16634 10.818H4.227C4.227 10.5589 4.01647 10.3484 3.75734 10.3484C3.49822 10.3484 3.28769 10.5589 3.28769 10.818C3.28769 11.0771 3.49822 11.2877 3.75734 11.2877Z"
        fill="currentColor"
      />
    </svg>
  );
}
