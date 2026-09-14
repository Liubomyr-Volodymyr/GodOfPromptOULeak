/**
 * Roles taxonomy — the persona axis of the library ("prompts for
 * {role}"). Canonical list provided by Robert; each role is a
 * programmatic-SEO gate at /prompt-library/role/[slug].
 *
 * Per-prompt role assignment comes from a backend field that isn't live
 * yet, so role PAGES currently show the general popular set as a stand-in
 * (see getPromptsByRole) until prompts carry a role.
 */

export type Role = { slug: string; name: string };

const ROLES: Role[] = [
  { slug: "solopreneurs", name: "Solopreneurs" },
  { slug: "entrepreneurs", name: "Entrepreneurs" },
  { slug: "business-owners", name: "Business Owners" },
  { slug: "freelancers", name: "Freelancers" },
  { slug: "agencies", name: "Agencies" },
  { slug: "ecommerce-sellers", name: "Ecommerce Sellers" },
  { slug: "marketers", name: "Marketers" },
  { slug: "sales-teams", name: "Sales Teams" },
  { slug: "copywriters", name: "Copywriters" },
  { slug: "content-creators", name: "Content Creators" },
  { slug: "designers", name: "Designers" },
  { slug: "photographers", name: "Photographers" },
  { slug: "developers", name: "Developers" },
  { slug: "ai-engineers", name: "AI Engineers" },
  { slug: "lawyers", name: "Lawyers" },
  { slug: "doctors", name: "Doctors" },
  { slug: "accountants", name: "Accountants" },
  { slug: "real-estate-agents", name: "Real Estate Agents" },
  { slug: "recruiters", name: "Recruiters" },
  { slug: "teachers", name: "Teachers" },
  { slug: "students", name: "Students" },
  { slug: "coaches", name: "Coaches" },
  { slug: "consultants", name: "Consultants" },
  { slug: "virtual-assistants", name: "Virtual Assistants" },
  { slug: "traders", name: "Traders" },
];

const BY_SLUG = new Map(ROLES.map((r) => [r.slug, r]));

export function getRoles(): Role[] {
  return ROLES;
}

export function getRoleBySlug(slug: string): Role | null {
  return BY_SLUG.get(slug) ?? null;
}
