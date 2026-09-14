import NewsletterCard from "@/components/marketing/NewsletterCard";

/**
 * NewsletterForm — the homepage placement of the reusable NewsletterCard
 * (Figma 2033:20731). The card itself is shared across pages + the timed
 * popup; this is just the section chrome around it.
 */
export default function NewsletterForm() {
  return (
    <section aria-label="Newsletter" className="mx-auto w-full max-w-[1200px] px-6 py-12 max-[640px]:px-4 max-[640px]:py-8">
      <NewsletterCard source="homepage-newsletter" />
    </section>
  );
}
