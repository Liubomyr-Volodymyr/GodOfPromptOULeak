"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getGeneratorTaskStatus } from "@/lib/api";
import GeneratorResult from "./GeneratorResult";
import GeneratorWaitCard from "./GeneratorWaitCard";

/** localStorage key the generator sets with the task_id before Stripe redirect. */
const TASK_ID_KEY = "gop_generator_task_id";

const POLL_MS = 5000;
const MAX_ATTEMPTS = 48; // ~4 minutes

type Phase = "loading" | "ready" | "timeout" | "error" | "none";

export default function GeneratorSuccessClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [result, setResult] = useState<{ name?: string; body: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let taskId: number | null = null;
    try {
      const raw = localStorage.getItem(TASK_ID_KEY);
      taskId = raw ? Number(raw) : null;
    } catch {
      /* localStorage blocked */
    }

    if (!taskId || Number.isNaN(taskId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time read of client-only localStorage
      setPhase("none");
      return;
    }

    let cancelled = false;
    let attempts = 0;

    async function poll(id: number) {
      if (cancelled) return;
      try {
        const s = await getGeneratorTaskStatus(id);
        if (s.prompt_body) {
          setResult({ name: s.prompt_name, body: s.prompt_body });
          setPhase("ready");
          try {
            localStorage.removeItem(TASK_ID_KEY);
          } catch {
            /* ignore */
          }
          return;
        }
        if (/fail|error|cancel/i.test(s.status ?? "")) {
          setPhase("error");
          return;
        }
      } catch {
        // transient network/5xx — keep polling within the attempt budget
      }
      attempts += 1;
      if (attempts >= MAX_ATTEMPTS) {
        setPhase("timeout");
        return;
      }
      timer.current = setTimeout(() => poll(id), POLL_MS);
    }

    poll(taskId);
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const generateMore = () => router.push("/prompt-generator");

  if (phase === "ready" && result) {
    return <GeneratorResult promptName={result.name} promptBody={result.body} />;
  }

  if (phase === "timeout" || phase === "error") {
    return (
      <div className="w-full max-w-[440px] rounded-[24px] border border-gop-ink-hairline bg-white p-6 text-center shadow-[0_12px_32px_rgba(22,20,21,0.06)]">
        <p className="m-0 text-[17px] font-semibold text-gop-ink">
          {phase === "error" ? "That one didn't go through" : "Still cooking"}
        </p>
        <p className="m-0 mt-2 text-[14px] leading-6 text-gop-ink-muted">
          {phase === "error"
            ? "We hit a snag generating your prompt. Our team has been notified — please reach out if it doesn't arrive."
            : "Your prompt is taking a little longer than usual. We'll email it the moment it's ready — you can safely close this tab."}
        </p>
        <button
          type="button"
          onClick={generateMore}
          className="mt-5 inline-flex h-10 items-center rounded-full border border-gop-ink-hairline bg-white px-4 text-[14px] font-medium text-gop-ink hover:bg-gop-ink-wash"
        >
          Generate another
        </button>
      </div>
    );
  }

  if (phase === "none") {
    // No generation in flight (e.g. a bundle purchase landed here) — the page
    // header already says thank-you; nothing to poll.
    return null;
  }

  return <GeneratorWaitCard onGenerateMore={generateMore} />;
}
