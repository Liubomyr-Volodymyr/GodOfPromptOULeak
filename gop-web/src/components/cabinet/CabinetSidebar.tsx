import Image from "next/image";
import {
  Bell,
  Bookmark,
  CircleHelp,
  Home,
  LogOut,
  PackageCheck,
  UserRoundPen,
} from "lucide-react";

import Link from "@/components/ui/Link";
import { cabinetHref } from "./navigation";
import type { CabinetSection, CabinetUser } from "./types";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { section: "prompts" as const, label: "My Prompts", icon: Bookmark },
  { section: "products" as const, label: "Products", icon: PackageCheck },
  { section: "settings" as const, label: "Account Settings", icon: UserRoundPen },
  { section: "notifications" as const, label: "Notifications", icon: Bell },
  { section: "support" as const, label: "Support", icon: CircleHelp },
];

type Props = {
  activeSection: CabinetSection;
  user: CabinetUser;
  onLogout?: () => void;
};

function initials(user: CabinetUser) {
  return `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() || "GP";
}

export default function CabinetSidebar({
  activeSection,
  user,
  onLogout,
}: Props) {
  return (
    <aside className="w-[236px] shrink-0 max-[760px]:w-full" aria-label="Account navigation">
      <div className="rounded-[24px] bg-gop-menu-bg p-3 text-gop-on-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="mb-3 flex min-w-0 items-center gap-3 rounded-[16px] px-2 py-2">
          <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gop-card text-[13px] font-medium text-white">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt="" fill sizes="40px" className="object-cover" />
            ) : (
              initials(user)
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-medium leading-5 text-[#f7f7f7]">
              {user.firstName} {user.lastName}
            </span>
            <span className="block truncate text-[12px] leading-4 text-gop-menu-item-2">
              {user.email}
            </span>
          </span>
        </div>

        <nav className="flex flex-col gap-1 max-[760px]:grid max-[760px]:grid-cols-2">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const selected = "section" in item && item.section === activeSection;
            const classes = [
              "flex h-10 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[14px]",
              "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold",
              selected
                ? "bg-white/20 text-[#f7f7f7]"
                : "text-gop-menu-item-2 hover:bg-white/[0.08] hover:text-[#f7f7f7]",
            ].join(" ");

            return (
              <Link
                key={item.label}
                href={"section" in item ? cabinetHref(item.section as CabinetSection) : item.href}
                className={classes}
                aria-current={selected ? "page" : undefined}
              >
                <Icon size={18} strokeWidth={1.7} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="my-3 h-px bg-white/[0.08]" />
        <button
          type="button"
          onClick={onLogout}
          className="flex h-10 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[14px] text-gop-menu-item-2 transition-colors hover:bg-white/[0.08] hover:text-[#f7f7f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold"
        >
          <LogOut size={18} strokeWidth={1.7} />
          <span>Logout</span>
        </button>
      </div>

      <Link
        href="/prompt-generator"
        className="group relative mt-3 block h-[132px] overflow-hidden rounded-[16px] border border-white/[0.08] bg-white/[0.06] text-center text-white shadow-[inset_0_27px_76px_rgba(255,255,255,0.06),inset_0_0.6px_2px_rgba(255,255,255,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold max-[760px]:hidden"
      >
        <Image
          src="/images/cabinet/promo-rays.svg"
          alt=""
          width={364}
          height={364}
          className="absolute left-1/2 top-[-112px] size-[300px] -translate-x-1/2 opacity-55 transition-transform duration-300 group-hover:scale-105"
        />
        <Image
          src="/images/cabinet/promo-prompt.svg"
          alt=""
          width={55}
          height={74}
          className="absolute left-5 top-3 h-[62px] w-auto -rotate-6 opacity-75"
        />
        <Image
          src="/images/cabinet/promo-document.svg"
          alt=""
          width={55}
          height={74}
          className="absolute right-5 top-3 h-[62px] w-auto rotate-6 opacity-75"
        />
        <Image
          src="/images/cabinet/promo-orb.svg"
          alt=""
          width={76}
          height={76}
          className="absolute left-1/2 top-2 size-[58px] -translate-x-1/2"
        />
        <Image
          src="/images/cabinet/promo-logo.svg"
          alt=""
          width={38}
          height={38}
          className="absolute left-1/2 top-[21px] size-[29px] -translate-x-1/2"
        />
        <span className="absolute inset-x-3 bottom-[27px] whitespace-nowrap font-mono text-[11px] font-medium leading-4 text-white/75">
          Unlock Full Experience
        </span>
        <span className="absolute inset-x-2 bottom-2 whitespace-nowrap font-mono text-[8px] leading-3 text-gop-menu-item-2">
          Customise prompts for maximum results
        </span>
      </Link>
    </aside>
  );
}
