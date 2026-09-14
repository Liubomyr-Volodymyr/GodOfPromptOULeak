/**
 * Shared client-side cache of the signed-in user (`GET /api/auth/me` — see
 * lib/api/me.ts). See ADR-004 in project-docs/DECISIONS.md for why this is a
 * Zustand store rather than per-component state: TopNavigation and the
 * /user/* cabinet pages both need the same profile, and without a shared
 * store each one re-fetches and re-derives it independently.
 *
 * Every consumer calls `refresh()` on mount / on navigation (same trigger the
 * old per-component effects used) — the store dedupes the race by aborting
 * whichever fetch is still in flight when a newer one starts.
 */
import { create } from "zustand";
import { clearSession, isSignedIn } from "@/lib/auth";
import { fetchCurrentUser, type CurrentUser } from "@/lib/api";

export type UserStatus = "idle" | "loading" | "ready" | "signed-out";

type UserState = {
  user: CurrentUser | null;
  status: UserStatus;
  /** Re-checks the local token and, if present, re-fetches /api/auth/me. */
  refresh: () => Promise<void>;
  /** Drops the local session and the cached profile (sign-out). */
  clear: () => void;
};

let inflight: AbortController | null = null;

export const useUserStore = create<UserState>((set) => ({
  user: null,
  status: "idle",
  refresh: async () => {
    inflight?.abort();

    if (!isSignedIn()) {
      inflight = null;
      set({ user: null, status: "signed-out" });
      return;
    }

    const controller = new AbortController();
    inflight = controller;
    set({ status: "loading" });

    const user = await fetchCurrentUser(controller.signal);
    if (controller.signal.aborted) return;

    set({ user, status: user ? "ready" : "signed-out" });
  },
  clear: () => {
    inflight?.abort();
    inflight = null;
    clearSession();
    set({ user: null, status: "signed-out" });
  },
}));
