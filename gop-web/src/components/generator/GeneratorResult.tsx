"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * GeneratorResult — the finished custom prompt (shown when task-status returns
 * a ready prompt_body). Figma's linked node only covered the wait card, so
 * this is built consistent with the design system: a light card with the
 * prompt name, the copy-ready prompt body, and a copy control.
 */
export default function GeneratorResult({
  promptName,
  promptBody,
}: {
  promptName?: string;
  promptBody: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(promptBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — the text is selectable in the block below
    }
  }

  return (
    <div className="w-full max-w-[720px] rounded-[24px] border border-gop-ink-hairline bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_12px_32px_rgba(22,20,21,0.06)] max-[640px]:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(43,221,123,0.12)] px-2.5 py-1 text-[12px] font-medium text-emerald-700">
            <Check size={13} aria-hidden />
            Your prompt is ready
          </span>
          {promptName && (
            <h2 className="m-0 mt-3 text-[20px] font-semibold tracking-[-0.01em] text-gop-ink">
              {promptName}
            </h2>
          )}
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy prompt"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-gop-ink-hairline bg-white px-3.5 text-[13px] font-medium text-gop-ink transition-colors hover:bg-gop-ink-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold"
        >
          {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre className="m-0 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-[16px] border border-gop-ink-hairline bg-gop-ink-wash p-4 font-mono text-[13.5px] leading-[1.6] text-gop-ink">
        {promptBody}
      </pre>
    </div>
  );
}
