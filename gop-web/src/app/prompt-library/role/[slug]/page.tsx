import { permanentRedirect } from "next/navigation";

/**
 * /prompt-library/role/[slug] → 308 permanent redirect to the audience axis
 * at /prompt-library/for/[slug]. The audience pattern ("AI prompts for
 * [profession]") is the canonical buyer-intent URL per the SEO spec; this
 * preserves any equity on the old /role/ URLs.
 */
export default async function RoleRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  permanentRedirect(`/prompt-library/for/${slug}`);
}
