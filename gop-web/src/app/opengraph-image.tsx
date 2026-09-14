import { ImageResponse } from "next/og";

/**
 * Site-wide share image, generated at request time.
 *
 * WHY GENERATED, NOT A FILE: every og:image on the site pointed at
 * https://godofprompt.ai/og-prompt-library.png, which 404s on every host —
 * `public/` contains no PNG at all. So every link shared anywhere rendered
 * without an image. On top of that, 20 routes (all the pSEO combinations)
 * declare no openGraph block and inherit the root, so a single broken file
 * took out the whole site's previews.
 *
 * Next's file convention means this ONE file now serves every route that
 * doesn't override it — no static assets to keep in sync, and no chance of a
 * page silently referencing an image that was never shipped. A route that
 * wants a bespoke image adds its own opengraph-image next to its page.
 *
 * Deliberately text-only: no logo file is referenced, because reading an
 * asset off disk here is the same fragility that caused the original bug.
 */
export const runtime = "edge";
export const alt = "God of Prompt — engineered AI prompts for every major model";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1B1A1A",
          padding: "72px",
          // Warm corner glow, matching the site's dark surfaces.
          backgroundImage:
            "radial-gradient(circle at 12% 0%, rgba(253,195,2,0.20), transparent 55%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ color: "#FDC302", fontSize: 40, fontWeight: 700 }}>&gt;_</div>
          <div style={{ color: "#F7F7F7", fontSize: 28, letterSpacing: -0.5 }}>God of Prompt</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              color: "#F7F7F7",
              fontSize: 68,
              lineHeight: 1.08,
              letterSpacing: -2,
              maxWidth: 940,
              display: "flex",
            }}
          >
            Engineered AI prompts that already work
          </div>
          <div style={{ color: "rgba(247,247,247,0.6)", fontSize: 28, display: "flex" }}>
            ChatGPT · Claude · Gemini · Grok · Midjourney
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            background: "#FDC302",
            color: "#1B1A1A",
            fontSize: 24,
            fontWeight: 600,
            padding: "14px 28px",
            borderRadius: 999,
          }}
        >
          godofprompt.ai
        </div>
      </div>
    ),
    size,
  );
}
