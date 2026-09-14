import type { CabinetSection } from "./types";

export const CABINET_ROUTES: ReadonlyArray<{
  section: CabinetSection;
  href: string;
  label: string;
  implemented: boolean;
}> = [
  { section: "prompts", href: "/user/prompts", label: "My Prompts", implemented: true },
  { section: "products", href: "/user/products", label: "Products", implemented: false },
  { section: "settings", href: "/user/account", label: "Account Settings", implemented: true },
  { section: "notifications", href: "/user/notifications", label: "Notifications", implemented: true },
  { section: "support", href: "/user/support", label: "Support", implemented: false },
];

export const CABINET_DEFAULT_HREF = "/user/products";

export function cabinetHref(section: CabinetSection) {
  const route = CABINET_ROUTES.find((candidate) => candidate.section === section);
  return route?.href ?? CABINET_DEFAULT_HREF;
}
