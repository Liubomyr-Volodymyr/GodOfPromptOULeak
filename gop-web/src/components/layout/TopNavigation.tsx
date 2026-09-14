"use client";

import Image from "next/image";
import Link from "@/components/ui/Link";
import { usePathname } from "next/navigation";
import {
  Bot,
  ChevronRight,
  LogOut,
  Menu,
  Plug,
  Sparkles,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import PromptCopilotDialog from "@/components/copilot/PromptCopilotDialog";
import SignInDialog from "@/components/auth/SignInDialog";
import {
  CABINET_DEFAULT_HREF,
  cabinetHref,
} from "@/components/cabinet/navigation";
import { getUserEmail, isSignedIn } from "@/lib/auth";
import { clearStoredPcpToken, getStoredPcpToken } from "@/lib/pcp-auth";
import { useUserStore } from "@/lib/store/user-store";
import { COPILOT_WEB_URL } from "@/lib/api";


export type TopNavigationProps = {
  variant: "signed-out" | "signed-in";
  accountInitials?: string;
  showNotifications?: boolean;
  className?: string;
};

type NavChild = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavItem = {
  label: string;
  href: string;
  gift?: boolean;
  children?: NavChild[];
};

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Prompts", href: "/prompt-library" },
  {
    label: "Tools",
    href: "/tools",
    children: [
      { label: "AI Tools", href: "/tools", icon: Sparkles },
      { label: "GPTs", href: "/tools/gpts", icon: Bot },
      { label: "MCPs", href: "/tools/mcps", icon: Plug },
      { label: "Skills", href: "/tools/skills", icon: Wand2 },
    ],
  },
  { label: "Free Guides", href: "/guides", gift: true },
  { label: "Products", href: "/products" },
  { label: "Contact us", href: "/contact" },
  { label: "Blog", href: "/blog" },
];

const desktopLink =
  "inline-flex h-8 items-center justify-center whitespace-nowrap rounded-full px-3 " +
  "text-[14px] font-normal leading-5 tracking-normal text-[#f7f7f7] no-underline " +
  "transition-colors duration-150 hover:bg-white/[0.08] focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-gop-gold focus-visible:ring-offset-2 focus-visible:ring-offset-gop-dark";

function PromptCopilotButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open Prompt Copilot"
      aria-haspopup="dialog"
      className={[
        "group/copilot inline-flex h-8 w-10 shrink-0 cursor-pointer items-center overflow-hidden rounded-3xl",
        "bg-gradient-to-b from-[#343333] to-[#242223] pl-2 pr-2 text-[#f7f7f7] no-underline",
        "transition-[width,padding] duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:w-[140px] hover:pr-3 motion-reduce:transition-none",
        "focus-visible:w-[140px] focus-visible:pr-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold",
      ].join(" ")}
    >
      <span className="inline-flex size-6 shrink-0 items-center justify-center">
        <Image
          src="/images/icons/navbar-copilot.svg"
          alt=""
          width={16}
          height={16}
          className="size-4"
        />
      </span>
      <span
        aria-hidden="true"
        className="max-w-0 overflow-hidden whitespace-nowrap text-[14px] font-normal leading-5 opacity-0 transition-[max-width,opacity] duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/copilot:max-w-[94px] group-hover/copilot:opacity-100 group-focus-visible/copilot:max-w-[94px] group-focus-visible/copilot:opacity-100 motion-reduce:transition-none"
      >
        Prompt Copilot
      </span>
    </button>
  );
}

/**
 * Replaces PromptCopilotButton once a Copilot session is connected — same
 * hover-expand pill language as SignedInControl. The pill itself is the
 * "profile": Copilot's account surface lives on its own app, so opening it
 * means sending the user there (new tab), not a page on this site.
 */
function PromptCopilotConnectedControl({
  mobile = false,
  avatarUrl,
  onDisconnect,
}: {
  mobile?: boolean;
  avatarUrl?: string | null;
  onDisconnect: () => void;
}) {
  return (
    <div className="group/copilot-connected relative flex h-8 shrink-0 items-center">
      <a
        href={COPILOT_WEB_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open Prompt Copilot"
        className="group/pcp inline-flex h-8 w-10 shrink-0 items-center overflow-hidden rounded-3xl bg-gradient-to-b from-[#343333] to-[#242223] pl-2 pr-2 text-[#f7f7f7] no-underline transition-[width,padding] duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:w-[140px] hover:pr-3 focus-visible:w-[140px] focus-visible:pr-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold motion-reduce:transition-none"
      >
        <span className="relative inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full">
          {avatarUrl ? (
            // blob: URL from the /api/pcp/avatar proxy — next/image can't
            // optimize a blob URL, so this stays a plain <img>.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="size-6 rounded-full object-cover" />
          ) : (
            <Image
              src="/images/icons/navbar-copilot.svg"
              alt=""
              width={16}
              height={16}
              className="size-4"
            />
          )}
        </span>
        <span
          aria-hidden="true"
          className="max-w-0 overflow-hidden whitespace-nowrap text-[14px] font-normal leading-5 opacity-0 transition-[max-width,opacity] duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/pcp:max-w-[94px] group-hover/pcp:opacity-100 group-focus-visible/pcp:max-w-[94px] group-focus-visible/pcp:opacity-100 motion-reduce:transition-none"
        >
          Prompt Copilot
        </span>
      </a>
      {!mobile && (
        <button
          type="button"
          onClick={onDisconnect}
          aria-label="Disconnect Prompt Copilot"
          className="invisible ml-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-white/50 opacity-0 transition-[opacity,visibility] duration-150 hover:bg-white/[0.08] hover:text-white focus-visible:visible focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold group-hover/copilot-connected:visible group-hover/copilot-connected:opacity-100 group-focus-within/copilot-connected:visible group-focus-within/copilot-connected:opacity-100"
        >
          <LogOut size={14} />
        </button>
      )}
    </div>
  );
}

function SignedOutControl({
  mobile = false,
  onSignIn,
}: {
  mobile?: boolean;
  onSignIn: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSignIn}
      aria-haspopup="dialog"
      className={[
        "relative inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/40",
        "bg-gradient-to-t from-[#fdc302] from-50% to-[#ecdf5f] text-[14px] font-normal leading-5 text-[#3f3000]",
        "no-underline shadow-[0_0_0_1px_#fdc302] transition-[filter,transform] hover:brightness-[1.03]",
        "active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        mobile ? "h-10 w-full" : "h-8 w-[67px]",
      ].join(" ")}
    >
      Sign In
    </button>
  );
}

function SignedInControl({
  initials,
  showNotifications,
}: {
  initials: string;
  showNotifications: boolean;
}) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-2">
      {showNotifications && (
        <Link
          href={cabinetHref("notifications")}
          aria-label="Notifications"
          className="inline-flex size-11 items-center justify-center rounded-full text-[#f7f7f7] transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold"
        >
          <Image
            src="/images/icons/navbar-notification.svg"
            alt=""
            width={20}
            height={22}
            className="h-[22px] w-5"
          />
        </Link>
      )}

      <Link
        href={CABINET_DEFAULT_HREF}
        aria-label="Open account"
        className={[
          "group/account inline-flex h-8 w-8 shrink-0 items-center overflow-hidden rounded-full",
          "border border-[rgba(175,175,175,0.24)] bg-white pl-1 pr-1 text-[#4f4e4f] shadow-[0_0_0_1px_white]",
          "transition-[width,padding] duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:w-[132px] hover:pr-2 active:translate-y-px motion-reduce:transition-none",
          "focus-visible:w-[132px] focus-visible:pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold",
        ].join(" ")}
      >
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#242223] text-[13px] font-normal leading-4 text-[#f7f7f7]">
          {initials}
        </span>
        <span
          aria-hidden="true"
          className="flex max-w-0 items-center gap-1 overflow-hidden whitespace-nowrap pl-0 text-[14px] font-normal leading-5 opacity-0 transition-[max-width,padding,opacity] duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/account:max-w-[100px] group-hover/account:pl-3 group-hover/account:opacity-100 group-focus-visible/account:max-w-[100px] group-focus-visible/account:pl-3 group-focus-visible/account:opacity-100 motion-reduce:transition-none"
        >
          Account
          <Image
            src="/images/icons/navbar-account-chevron.svg"
            alt=""
            width={6}
            height={10}
            className="h-[10px] w-[6px]"
          />
        </span>
      </Link>
    </div>
  );
}

export default function TopNavigation({
  variant,
  accountInitials = "",
  showNotifications = false,
  className = "",
}: TopNavigationProps) {
  const pathname = usePathname() ?? "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  // Which mobile section is expanded. The sub-items used to render ALWAYS, so
  // the menu was permanently long and the chevron next to "Tools" promised a
  // collapse that never happened. Collapsed by default: the top level now fits
  // without scrolling, and the chevron means what it looks like.
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const openCopilot = () => setCopilotOpen(true);

  const [signInOpen, setSignInOpen] = useState(false);
  // Reflect the client-side session: once signed in, the nav shows the account
  // control instead of "Sign In" (SSR renders the passed `variant`, the effect
  // upgrades it after mount — no hydration mismatch).
  const [clientSignedIn, setClientSignedIn] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const currentUser = useUserStore((s) => s.user);
  const userStatus = useUserStore((s) => s.status);
  const refreshUser = useUserStore((s) => s.refresh);
  const syncAuth = () => {
    setClientSignedIn(isSignedIn());
    setAccountEmail(getUserEmail());
  };

  // Same hydration pattern as syncAuth, for the separate Prompt Copilot
  // session (see lib/pcp-auth.ts) — its token lives under its own key.
  const [pcpConnected, setPcpConnected] = useState(false);
  const [pcpAvatarUrl, setPcpAvatarUrl] = useState<string | null>(null);
  const syncPcp = () => setPcpConnected(Boolean(getStoredPcpToken()));
  const disconnectCopilot = () => {
    clearStoredPcpToken();
    syncPcp();
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only auth hydration
  useEffect(syncAuth, [pathname]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only Copilot session hydration
  useEffect(syncPcp, [pathname]);

  // Fetches the Copilot avatar through the same-origin proxy (PCP has no
  // CORS allowlist for this origin, so the browser can't attach the bearer
  // token and hit GET /api/users/avatar directly — see
  // app/api/pcp/avatar/route.ts). Runs once per connect (not on every
  // navigation) since the avatar doesn't change mid-session; the object URL
  // is revoked on disconnect/unmount to avoid leaking it.
  useEffect(() => {
    if (!pcpConnected) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only Copilot avatar hydration
      setPcpAvatarUrl(null);
      return;
    }
    const token = getStoredPcpToken();
    if (!token) {
      setPcpAvatarUrl(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    fetch("/api/pcp/avatar", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setPcpAvatarUrl(objectUrl);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [pcpConnected]);

  // Refreshes the shared user-store profile on every reload and every
  // client-side navigation (pathname dependency), same hydration pattern as
  // syncAuth. The store itself decides signed-in vs signed-out from the
  // token / the /api/auth/me response — see lib/store/user-store.ts.
  useEffect(() => {
    refreshUser();
  }, [pathname, refreshUser]);

  // A stale token (store lands on "signed-out" after checking /api/auth/me)
  // overrides the optimistic flip from syncAuth's synchronous token check.
  const effectiveVariant = clientSignedIn && userStatus !== "signed-out" ? "signed-in" : variant;
  const initials = currentUser
    ? (currentUser.firstName.slice(0, 1) + currentUser.lastName.slice(0, 1)).toUpperCase() ||
      currentUser.email.slice(0, 2).toUpperCase()
    : accountEmail
      ? accountEmail.slice(0, 2).toUpperCase()
      : accountInitials;

  return (
    <nav
      aria-label="Primary"
      className={`relative w-full ${className}`}
      data-figma-node="544:1465"
    >
      <div className="relative mx-auto flex h-[60px] w-full max-w-[1200px] items-center justify-between rounded-full border border-gop-dark bg-gop-dark p-2 text-[#f7f7f7] shadow-[0_20px_25px_-5px_rgba(13,12,8,0.10),0_10px_10px_-5px_rgba(0,0,0,0.04)]">
        <Link
          href="/"
          aria-label="God of Prompt home"
          className="relative size-11 shrink-0 overflow-hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold"
        >
          <Image
            src="/images/brand/gop-logo.svg"
            alt=""
            width={44}
            height={44}
            priority
            className="size-11"
          />
        </Link>

        <div className="ml-auto flex items-center gap-8 max-[1080px]:hidden">
          {/* gap-3 from the navbar-spacing PR (hover states no longer touch);
              onOpen keeps the Prompt Copilot popup wiring. */}
          <ul className="m-0 flex h-8 list-none items-center gap-3 p-0">
            <li>
              {pcpConnected ? (
                <PromptCopilotConnectedControl avatarUrl={pcpAvatarUrl} onDisconnect={disconnectCopilot} />
              ) : (
                <PromptCopilotButton onOpen={openCopilot} />
              )}
            </li>
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);

              if (item.children) {
                return (
                  <li key={item.href} className="group/tools relative">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`${desktopLink} w-[75px] pl-3 pr-2 ${active ? "bg-white/[0.10]" : ""}`}
                    >
                      {item.label}
                      <Image
                        src="/images/icons/navbar-chevron.svg"
                        alt=""
                        width={10}
                        height={6}
                        className="ml-1 h-[6px] w-[10px] transition-transform duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/tools:rotate-180 motion-reduce:transition-none"
                      />
                    </Link>

                    <div className="invisible absolute left-1/2 top-full min-w-60 -translate-x-1/2 translate-y-1 pt-2 opacity-0 transition-[opacity,transform,visibility] duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/tools:visible group-hover/tools:translate-y-0 group-hover/tools:opacity-100 group-focus-within/tools:visible group-focus-within/tools:translate-y-0 group-focus-within/tools:opacity-100 motion-reduce:transition-none">
                      {/* codex's treatment, kept: same bg-gop-dark as the navbar
                          with only the BOTTOM corners rounded, so the panel reads
                          as an extension of the bar rather than a floating card.
                          Do not "fix" this to the GlassMenu recipe — the attached
                          look is the point. */}
                      <div className="flex flex-col gap-1 rounded-b-3xl bg-gop-dark p-2">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = pathname === child.href;

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`group/row flex min-h-10 items-center gap-2.5 rounded-full px-3 text-[13.5px] text-[#f7f7f7] no-underline transition-colors duration-150 hover:bg-white/[0.08] hover:text-white ${childActive ? "bg-white/[0.16] font-medium text-white" : ""}`}
                            >
                              <ChildIcon
                                size={17}
                                className="text-gop-menu-icon transition-colors group-hover/row:text-white"
                              />
                              <span>{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`${desktopLink} ${active ? "bg-white/[0.10]" : ""}`}
                  >
                    {item.label}
                    {item.gift && (
                      <Image
                        src="/images/icons/navbar-gift.svg"
                        alt=""
                        width={14}
                        height={14}
                        className="ml-1 size-[14px]"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {effectiveVariant === "signed-out" ? (
            <SignedOutControl onSignIn={() => setSignInOpen(true)} />
          ) : (
            <SignedInControl
              initials={initials}
              showNotifications={showNotifications}
            />
          )}
        </div>

        <div className="ml-auto hidden items-center gap-1 max-[1080px]:flex">
          {pcpConnected ? (
            <PromptCopilotConnectedControl mobile avatarUrl={pcpAvatarUrl} onDisconnect={disconnectCopilot} />
          ) : (
            <PromptCopilotButton onOpen={openCopilot} />
          )}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => { setOpenSection(null); setMobileOpen((open) => !open); }}
            className="relative inline-flex size-11 items-center justify-center rounded-full border border-white/15 text-white transition-colors duration-150 hover:bg-white/[0.08]"
          >
            <Menu
              size={18}
              className={`absolute transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${mobileOpen ? "rotate-45 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
            />
            <X
              size={18}
              className={`absolute transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${mobileOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-45 scale-75 opacity-0"}`}
            />
          </button>
        </div>
      </div>

      <div
        aria-hidden={!mobileOpen}
        className={`absolute right-0 top-full z-10 ml-auto hidden w-full max-w-[420px] origin-top-right rounded-b-3xl bg-gop-dark p-2 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none max-[1080px]:block ${mobileOpen ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-[0.985] opacity-0"}`}
      >
        <ul className="m-0 list-none p-0">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              {item.children ? (
                /* Parent of a section: the row toggles rather than navigates,
                   so the chevron and the tap do the same thing. The section's
                   own page is still reachable — it is the first child row. */
                <button
                  type="button"
                  aria-expanded={openSection === item.label}
                  onClick={() => setOpenSection((cur) => (cur === item.label ? null : item.label))}
                  className="flex w-full items-center justify-between rounded-full px-3 py-2.5 text-left text-[13.5px] text-[#F7F7F7] transition-colors duration-150 hover:bg-white/[0.08] hover:text-white"
                >
                  <span className="inline-flex items-center gap-2">{item.label}</span>
                  <ChevronRight
                    size={17}
                    className={`opacity-50 transition-transform duration-200 ${openSection === item.label ? "rotate-90" : ""} motion-reduce:transition-none`}
                  />
                </button>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => { setOpenSection(null); setMobileOpen(false); }}
                  className="flex items-center justify-between rounded-full px-3 py-2.5 text-[13.5px] text-[#F7F7F7] no-underline transition-colors duration-150 hover:bg-white/[0.08] hover:text-white"
                >
                  <span className="inline-flex items-center gap-2">
                    {item.label}
                    {item.gift && (
                      <Image
                        src="/images/icons/navbar-gift.svg"
                        alt=""
                        width={14}
                        height={14}
                      />
                    )}
                  </span>
                </Link>
              )}
              {item.children && openSection === item.label && (
                <ul className="mb-1 ml-4 list-none border-l border-white/10 pl-2">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;

                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={() => { setOpenSection(null); setMobileOpen(false); }}
                          className="flex min-h-10 items-center gap-2.5 rounded-full px-3 text-[13.5px] text-[#F7F7F7] no-underline transition-colors duration-150 hover:bg-white/[0.08] hover:text-white"
                        >
                          <ChildIcon size={16} />
                          {child.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}
          {pcpConnected && (
            <li className="px-2 pb-1">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  disconnectCopilot();
                }}
                className="flex h-10 w-full items-center gap-2.5 rounded-full px-3 text-left text-[13.5px] text-gop-menu-item-2 transition-colors duration-150 hover:bg-white/[0.08] hover:text-white"
              >
                <LogOut size={16} />
                Disconnect Prompt Copilot
              </button>
            </li>
          )}
          <li className="p-2">
            {effectiveVariant === "signed-out" ? (
              <SignedOutControl
                mobile
                onSignIn={() => {
                  setMobileOpen(false);
                  setSignInOpen(true);
                }}
              />
            ) : (
              <SignedInControl
                initials={initials}
                showNotifications={showNotifications}
              />
            )}
          </li>
        </ul>
      </div>

      <PromptCopilotDialog
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        returnTo={pathname}
      />
      <SignInDialog
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSignedIn={syncAuth}
      />
    </nav>
  );
}
