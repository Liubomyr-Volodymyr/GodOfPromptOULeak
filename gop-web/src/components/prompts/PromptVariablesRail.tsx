"use client";

import { memo, useId } from "react";
import { RefreshCw, Settings2, Loader2 } from "lucide-react";
import type { PromptVariable } from "./promptVariables";
import styles from "./PromptTerminal.module.css";

/**
 * PromptVariablesRail — the right column of the prompt terminal (Figma
 * 1552:4643 "Variables Container"): the "Fill in the variables" header with
 * an n/total counter + reset, the stacked fill-in fields, and the gold
 * Context Inject button. Split out of PromptTerminal to keep both files
 * small; shares PromptTerminal.module.css (.panel/.field/.injectButton).
 *
 * All state lives in the parent PromptTerminal — this is presentational.
 * onVarChange/onVarFocus let the parent drive its scroll-to-variable hook.
 */
export default function PromptVariablesRail({
  variables,
  values,
  filledCount,
  injecting,
  onVarChange,
  onVarFocus,
  onReset,
  onContextInject,
}: {
  variables: PromptVariable[];
  values: Record<string, string>;
  filledCount: number;
  injecting: boolean;
  onVarChange: (key: string, value: string) => void;
  onVarFocus: (key: string) => void;
  onReset: () => void;
  onContextInject: () => void;
}) {
  return (
    <aside className={`${styles.panel} flex h-[413px] max-h-[calc(100dvh-3rem)] flex-col gap-6 p-6 max-[960px]:h-auto max-[960px]:max-h-none`}>
      <div className="flex items-center justify-between gap-2 py-1">
        <div className="flex items-center gap-2">
          <Settings2 size={22} strokeWidth={1.5} className="text-gop-menu-item" aria-hidden />
          <h2 className="m-0 font-sans text-[16px] font-normal leading-6 text-gop-menu-item">
            Fill in the variables
          </h2>
        </div>
        {variables.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="font-sans text-[12px] tabular-nums text-white/70">
              {filledCount}/{variables.length}
            </span>
            {/* Refresh-cw (Figma) — always visible, dimmed/disabled when there
                is nothing to reset; stays mounted so focus never unmounts
                under the user mid-interaction. */}
            <button
              type="button"
              onClick={onReset}
              disabled={filledCount === 0}
              title="Reset variables"
              aria-label="Reset variables"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-[color,background,opacity] hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        )}
      </div>

      {variables.length > 0 ? (
        <div className="-mr-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-2 [scrollbar-width:thin]">
          {variables.map((v) => (
            <VariableField
              key={v.key}
              variable={v}
              value={values[v.key] ?? ""}
              onChange={(val) => onVarChange(v.key, val)}
              onFocus={() => onVarFocus(v.key)}
            />
          ))}
        </div>
      ) : (
        <p className="m-0 font-sans text-[13px] leading-5 text-white/60">
          This prompt is ready to run. No variables to fill in. Copy it or open
          it in your model of choice.
        </p>
      )}

      {/* Context Inject — hand this prompt (with your filled-in variables) to
          Prompt Copilot as starting context. */}
      <div className="mt-auto flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onContextInject}
          disabled={injecting}
          aria-busy={injecting}
          className={`${styles.injectButton} disabled:cursor-wait disabled:opacity-80`}
          aria-label="Context Inject. Fill the variables with your saved Prompt Copilot context"
        >
          {injecting ? (
            <>
              <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />
              Injecting…
            </>
          ) : (
            <>
              <ContextInjectIcon />
              Context Inject
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

/* ── Variable field — floating-label input (Figma textfield 660:16272) ──
 * Empty+blurred: 14px placeholder. Focused or filled: 11px label floats
 * above the 14px value (peer pattern — no JS focus tracking). The
 * placeholder goes transparent on focus so label + placeholder never show
 * the same text twice. Insert-style tokens get a textarea (long, possibly
 * multi-line values). */
function VariableField({
  variable,
  value,
  onChange,
  onFocus,
}: {
  variable: PromptVariable;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
}) {
  const inputCls =
    "peer order-2 w-full border-0 bg-transparent p-0 font-sans text-[14px] leading-5 text-gop-menu-item caret-gop-accent-yellow outline-none placeholder:text-white/75 focus:placeholder:text-transparent";
  return (
    <label className={styles.field}>
      {variable.multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          placeholder={variable.label}
          aria-label={variable.label}
          rows={1}
          className={`${inputCls} min-h-5 resize-y [field-sizing:content] max-h-40`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          placeholder={variable.label}
          aria-label={variable.label}
          className={inputCls}
        />
      )}
      <span
        aria-hidden
        className="order-1 hidden font-sans text-[11px] leading-4 tracking-[0.2px] text-white/75 peer-focus:block peer-[:not(:placeholder-shown)]:block"
      >
        {variable.label}
      </span>
    </label>
  );
}

/* ── Context Inject mark — gold Copilot wand (Figma 1315:6121) ─────── */
const ContextInjectIcon = memo(function ContextInjectIcon() {
  const uid = useId();
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="flex-shrink-0">
      <path
        d="M19.4 2L22 4.6M18.75 5.25L20.7 3.3M20.05 6.55L13.355 13.245C12.705 13.895 11.73 13.895 11.145 13.245L10.755 12.855C10.105 12.205 10.105 11.23 10.755 10.645L17.45 3.95M13.55 7.85L16.15 10.45M10.95 13.05L9 15M16.8 3.3L20.7 7.2"
        stroke={`url(#${uid}-a)`}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2"
        stroke={`url(#${uid}-b)`}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id={`${uid}-a`} x1="15.5" y1="2" x2="15.5" y2="15" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDFD80" />
          <stop offset="1" stopColor="#E6B142" />
        </linearGradient>
        <linearGradient id={`${uid}-b`} x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDFD80" />
          <stop offset="1" stopColor="#E6B142" />
        </linearGradient>
      </defs>
    </svg>
  );
});
