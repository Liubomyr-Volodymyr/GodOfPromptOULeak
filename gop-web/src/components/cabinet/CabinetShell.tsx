import type { ReactNode } from "react";

import CabinetSidebar from "./CabinetSidebar";
import type { CabinetSection, CabinetUser } from "./types";

type Props = {
  activeSection: CabinetSection;
  user: CabinetUser;
  children: ReactNode;
  onLogout?: () => void;
};

export default function CabinetShell({
  activeSection,
  user,
  children,
  onLogout,
}: Props) {
  return (
    <section className="fixed inset-0 z-40 overflow-y-auto bg-gop-card text-gop-on-dark">
      <div className="mx-auto flex min-h-full w-full max-w-[1200px] gap-12 px-6 pb-12 pt-[108px] max-[900px]:gap-6 max-[760px]:flex-col max-[640px]:px-3 max-[640px]:pt-[96px]">
        <CabinetSidebar
          activeSection={activeSection}
          user={user}
          onLogout={onLogout}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </section>
  );
}

export function CabinetHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-12 max-[640px]:mb-8">
      <h1 className="m-0 text-[32px] font-medium leading-10 tracking-[-1px] text-[#f7f7f7]">
        {title}
      </h1>
      {subtitle ? (
        <p className="m-0 mt-2 text-[14px] leading-5 text-gop-menu-item-2">{subtitle}</p>
      ) : null}
    </header>
  );
}
