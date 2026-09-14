"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CABINET_DEFAULT_HREF } from "@/components/cabinet/navigation";
import { storeSession } from "@/lib/auth";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to a one-time browser API read (URL query), not derivable state
      setError(true);
      return;
    }
    storeSession({ access_token: token });
    router.replace(CABINET_DEFAULT_HREF);
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6 text-center font-sans text-white/70">
      {error ? "Couldn't sign you in with Google. Please try again." : "Signing you in…"}
    </div>
  );
}
