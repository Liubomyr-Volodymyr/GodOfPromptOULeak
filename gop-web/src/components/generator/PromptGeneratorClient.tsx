"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Code2, Image as ImageIcon, Lock, Type } from "lucide-react";

import Icon from "@/components/icon/Icon";
import CtaButton from "@/components/ui/CtaButton";
import { createCustomPrompt, GeneratorError } from "@/lib/api";
import { getUserEmail, isSignedIn } from "@/lib/auth";

type PromptType = "all" | "text" | "image" | "code";

/** Where a gated submit stashes the in-progress goal across the sign-up hop. */
const STASH_KEY = "gop_generator_task";
const MIN_TASK = 10; // backend CreateCustomPromptDto requires task >= 10 chars
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const EXAMPLES = [
  "Outline a LinkedIn post to showcase my recent achievement.",
  "Provide SEO keywords for a blog targeting solopreneurs.",
  "Draft a cold outreach email that books a discovery call.",
  "Create a call-to-action for my Facebook ad for lead gen.",
] as const;

const PROMPT_TYPES: Array<{
  value: PromptType;
  label: string;
  icon?: typeof Type;
}> = [
  { value: "all", label: "All" },
  { value: "text", label: "Text", icon: Type },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "code", label: "Code", icon: Code2 },
];

export default function PromptGeneratorClient() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [email, setEmail] = useState("");
  const [promptType, setPromptType] = useState<PromptType>("text");
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Client-only: reflect auth state, prefill the account email, and restore a
  // goal stashed before a sign-up hop (so the user lands back mid-flow).
  useEffect(() => {
    // Hydrate browser-only auth/session state on mount (can't read during SSR).
    /* eslint-disable react-hooks/set-state-in-effect */
    setSignedIn(isSignedIn());
    const accountEmail = getUserEmail();
    if (accountEmail) setEmail(accountEmail);
    try {
      const stashed = sessionStorage.getItem(STASH_KEY);
      if (stashed) {
        const { task, promptType: t } = JSON.parse(stashed) as { task?: string; promptType?: PromptType };
        if (task) setGoal(task);
        if (t) setPromptType(t);
        sessionStorage.removeItem(STASH_KEY);
      }
    } catch {
      /* sessionStorage/JSON unavailable — nothing to restore */
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const fillExample = (example: string) => {
    setGoal(example);
    setError("");
    textareaRef.current?.focus();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const task = goal.trim();

    if (task.length < MIN_TASK) {
      setError("Describe your goal in a little more detail (at least 10 characters).");
      textareaRef.current?.focus();
      return;
    }
    setError("");

    // Sign-up gate: creating a custom prompt requires an account.
    if (!isSignedIn()) {
      try {
        sessionStorage.setItem(STASH_KEY, JSON.stringify({ task, promptType }));
        if (EMAIL_RE.test(email.trim())) sessionStorage.setItem("gop_prefill_email", email.trim().toLowerCase());
      } catch {
        /* non-fatal — the goal just won't be restored after sign-up */
      }
      router.push(`/signup?redirect=${encodeURIComponent("/prompt-generator")}`);
      return;
    }

    // Signed in → start the generation (backend returns a Stripe checkout url).
    const submitEmail = (getUserEmail() ?? email).trim().toLowerCase();
    if (!EMAIL_RE.test(submitEmail)) {
      setError("We couldn't find your account email. Please sign in again.");
      return;
    }
    setSubmitting(true);
    try {
      const { url, task_id } = await createCustomPrompt({ email: submitEmail, task });
      // Stash the task id so the post-checkout success page can poll for the
      // finished prompt (Stripe's success_url carries no id — see success page).
      try {
        localStorage.setItem("gop_generator_task_id", String(task_id));
      } catch {
        /* localStorage blocked — success page will fall back to email delivery */
      }
      window.location.href = url;
    } catch (err) {
      setError(
        err instanceof GeneratorError ? err.message : "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  };

  // Signed-out: the email field is gated. Preserve the goal and send the user
  // to sign up (the only auth entry today), returning them here after.
  const requireSignIn = () => {
    const task = goal.trim();
    try {
      sessionStorage.setItem(STASH_KEY, JSON.stringify({ task, promptType }));
    } catch {
      /* non-fatal — the goal just won't be restored */
    }
    router.push(`/signup?redirect=${encodeURIComponent("/prompt-generator")}`);
  };

  return (
    <section
      aria-labelledby="prompt-generator-title"
      data-figma-node="2242:23352"
      className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-6 pb-12 pt-20 max-[640px]:px-4 max-[640px]:pt-12"
    >
      <div className="flex w-full max-w-[797px] flex-col items-center gap-12">
        <header className="flex max-w-[598px] flex-col items-center gap-3.5 text-center">
          <h1
            id="prompt-generator-title"
            className="m-0 flex flex-col items-center text-[#1b1a1a]"
          >
            <span className="text-[56px] font-light leading-[64px] tracking-[-1.5px] max-[640px]:text-[40px] max-[640px]:leading-12">
              Generate Your
            </span>
            <span className="flex items-center gap-2 whitespace-nowrap max-[640px]:flex-col max-[640px]:gap-0">
              <span className="text-[56px] font-bold italic leading-[80px] tracking-[-2px] [text-shadow:0_3px_8px_rgba(0,0,0,0.24)] max-[640px]:text-[40px] max-[640px]:leading-12">
                AI Prompts
              </span>
              <span className="text-[56px] font-light leading-[64px] tracking-[-1.5px] max-[640px]:text-[40px] max-[640px]:leading-12">
                In One Click
              </span>
            </span>
          </h1>
          <p className="m-0 max-w-[598px] text-[18px] leading-6 text-[#4f4e4f]/60">
            Get powerful AI prompts with ease — just describe your goal like you&apos;re
            chatting with a friend, and we&apos;ll handle the rest.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label="Custom prompt generator"
          className={[
            "relative flex w-full flex-col gap-4 overflow-hidden rounded-3xl p-6",
            "bg-[rgba(20,20,20,0.8)] text-[#f7f7f7] backdrop-blur-3xl",
            "shadow-[0_-12px_30px_rgba(0,0,0,0.12),0_4px_6px_rgba(0,0,0,0.06),0_12px_13px_rgba(0,0,0,0.17),0_-3px_5px_rgba(0,0,0,0.09)]",
          ].join(" ")}
        >
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <label
                htmlFor="generator-goal"
                className="text-[18px] leading-6 text-white/75"
              >
                What&apos;s your goal?
              </label>

              <div
                role="group"
                aria-label="Prompt output type"
                className="flex h-8 items-center rounded-full bg-white/16 p-1"
              >
                {PROMPT_TYPES.map(({ value, label, icon: PromptTypeIcon }) => {
                  const active = promptType === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${label} prompts`}
                      aria-pressed={active}
                      onClick={() => setPromptType(value)}
                      className={[
                        "group/typebtn inline-flex h-6 items-center justify-center gap-1 rounded-full px-2",
                        "text-[14px] leading-5 transition-colors focus-visible:outline-none",
                        "focus-visible:ring-2 focus-visible:ring-gop-gold",
                        active
                          ? "bg-white/16 text-[#f7f7f7] shadow-[inset_0_0.6px_2px_rgba(255,255,255,0.16)]"
                          : "text-white/75 hover:bg-white/[0.08]",
                      ].join(" ")}
                    >
                      {PromptTypeIcon && <PromptTypeIcon size={16} aria-hidden />}
                      <span
                        aria-hidden={value === "image" || value === "code" ? true : undefined}
                        className={
                          value === "image" || value === "code"
                            ? "max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-200 ease-out group-hover/typebtn:max-w-[54px] group-hover/typebtn:opacity-100 group-focus-visible/typebtn:max-w-[54px] group-focus-visible/typebtn:opacity-100"
                            : ""
                        }
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <textarea
              id="generator-goal"
              ref={textareaRef}
              value={goal}
              onChange={(event) => {
                setGoal(event.target.value);
                if (error) setError("");
              }}
              maxLength={1000}
              placeholder="Describe what you want to accomplish"
              className={[
                "h-[237px] w-full resize-none rounded-3xl border border-white/[0.04]",
                "bg-white/16 p-4 text-[14px] leading-5 text-[#f7f7f7] outline-none",
                "placeholder:text-white/75 focus:border-white/20",
                "shadow-[inset_0_27px_76px_rgba(255,255,255,0.06),inset_0_0.6px_2px_rgba(255,255,255,0.16)]",
              ].join(" ")}
            />
          </div>

          <div className="flex items-center gap-4 max-[520px]:flex-col">
            {signedIn ? (
              <>
                <label htmlFor="generator-email" className="sr-only">
                  Email
                </label>
                <input
                  id="generator-email"
                  type="email"
                  value={email}
                  readOnly
                  placeholder="Email"
                  autoComplete="email"
                  title="Your account email"
                  className="h-11 min-w-0 flex-1 cursor-default rounded-xl border border-white/[0.04] bg-white/[0.04] px-4 text-[14px] leading-5 text-[#f7f7f7] opacity-70 outline-none placeholder:text-white/75 max-[520px]:w-full"
                />
              </>
            ) : (
              // Signed-out: the email field is gated behind auth.
              <button
                type="button"
                onClick={requireSignIn}
                aria-label="Sign in to access"
                className="group/lock flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 text-[14px] leading-5 text-white/60 transition-colors hover:border-white/20 hover:text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold max-[520px]:w-full"
              >
                <Lock size={15} aria-hidden className="shrink-0 text-white/45 transition-colors group-hover/lock:text-white/70" />
                Sign in to access
              </button>
            )}
            <CtaButton
              type="submit"
              variant="gold"
              size="md"
              disabled={submitting}
              className="shrink-0 !px-4 !text-[18px] !font-normal max-[520px]:w-full"
            >
              {submitting ? "Starting…" : "Generate"}
            </CtaButton>
          </div>

          {error && (
            <p role="alert" className="m-0 text-[13px] leading-5 text-white/75">
              {error}
            </p>
          )}

          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04),inset_0_1px_2px_rgba(255,255,255,0.08)]"
          />
        </form>
      </div>

      <div className="mt-20 grid w-full max-w-[1312px] grid-cols-4 gap-4 max-[1020px]:grid-cols-2 max-[600px]:mt-12 max-[600px]:grid-cols-1">
        {EXAMPLES.map((example, index) => (
          <button
            key={`${example}-${index}`}
            type="button"
            onClick={() => fillExample(example)}
            className={[
              "group relative flex min-h-20 items-center gap-4 overflow-hidden rounded-[20px]",
              "border border-[#eee] bg-gradient-to-t from-[#f6f6f6] to-[#fffdfd] p-4 text-left",
              "shadow-[0_1px_1px_0.5px_rgba(41,41,41,0.04),0_3px_3px_-1.5px_rgba(41,41,41,0.02),0_6px_6px_-3px_rgba(41,41,41,0.04),0_12px_12px_-6px_rgba(41,41,41,0.04),0_24px_24px_-12px_rgba(41,41,41,0.04),0_48px_48px_-24px_rgba(41,41,41,0.04)]",
              "transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold",
            ].join(" ")}
          >
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-white bg-white text-[#4f4e4f] shadow-[0_5px_4px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.16)]">
              <Icon name="sparkle" size={24} />
            </span>
            <span className="text-[14px] leading-5 text-[#4f4e4f]">{example}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
