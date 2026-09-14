"use client";

import { useState } from "react";

/**
 * CardHero — the full-bleed example-output image behind a photo-variant
 * prompt card (Figma 1442:4403). Absolutely fills the card; the caller
 * layers a scrim + content on top. If the CDN URL fails the image hides
 * itself and the card's dark surface shows through (graceful degrade).
 */
export default function CardHero({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
    />
  );
}
