"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setStoredPcpToken, sanitizeReturnTo } from "@/lib/pcp-auth";

/**
 * Receiving end of Prompt Copilot's cross-domain SSO handoff (see
 * lib/pcp-auth.ts). PCP redirects here with the access token in the URL
 * fragment (#token=...) — fragments never reach a server, so this has to be
 * read client-side before it can be stored and the user sent on their way.
 */
export default function CopilotCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    const returnTo = sanitizeReturnTo(
      new URLSearchParams(window.location.search).get("return_to") ?? "/",
    );
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to a one-time browser API read (URL fragment), not derivable state
      setError(true);
      return;
    }
    setStoredPcpToken(token);
    router.replace(returnTo);
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6 text-center font-sans text-white/70">
      {error ? "Couldn't connect Prompt Copilot. Please try again." : "Connecting Prompt Copilot…"}
    </div>
  );
}
