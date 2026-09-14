/**
 * ProseArticle — renders the WordPress `content.rendered` HTML in the GOP
 * brand. First-party content, but we still strip <script>/<style>/<iframe>
 * defensively before injecting. Typography is applied via child selectors so
 * the CMS markup needs no classes of its own.
 */

/** Remove executable / embed nodes from trusted-but-external CMS HTML. */
function sanitize(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "");
}

const PROSE = [
  "max-w-none font-sans text-[16.5px] leading-[1.75] text-gop-ink-muted",
  // paragraphs
  "[&_p]:m-0 [&_p]:mb-5",
  // headings
  "[&_h2]:mb-3 [&_h2]:mt-11 [&_h2]:font-sans [&_h2]:text-[26px] [&_h2]:font-bold [&_h2]:leading-[1.2] [&_h2]:tracking-[-0.015em] [&_h2]:text-gop-ink",
  "[&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:text-[20px] [&_h3]:font-bold [&_h3]:leading-snug [&_h3]:tracking-[-0.01em] [&_h3]:text-gop-ink",
  "[&_h4]:mb-2 [&_h4]:mt-6 [&_h4]:text-[17px] [&_h4]:font-semibold [&_h4]:text-gop-ink",
  // links
  "[&_a]:font-medium [&_a]:text-gop-ink [&_a]:underline [&_a]:decoration-gop-gold [&_a]:decoration-2 [&_a]:underline-offset-[3px] hover:[&_a]:text-gop-gold-dark",
  // lists
  "[&_ul]:mb-5 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-6 [&_ul]:marker:text-gop-gold-dark",
  "[&_ol]:mb-5 [&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-2 [&_ol]:pl-6 [&_ol]:marker:text-gop-ink-soft",
  "[&_li]:pl-1 [&_li_p]:mb-0",
  // emphasis
  "[&_strong]:font-semibold [&_strong]:text-gop-ink [&_b]:font-semibold [&_b]:text-gop-ink",
  // media
  "[&_img]:my-7 [&_img]:h-auto [&_img]:w-full [&_img]:rounded-[16px] [&_img]:border [&_img]:border-gop-ink-hairline",
  "[&_figure]:my-7 [&_figure]:mx-0 [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-[13px] [&_figcaption]:text-gop-ink-soft",
  // blockquote
  "[&_blockquote]:my-7 [&_blockquote]:border-l-2 [&_blockquote]:border-gop-gold [&_blockquote]:pl-5 [&_blockquote]:text-[18px] [&_blockquote]:italic [&_blockquote]:text-gop-ink",
  // code
  "[&_code]:rounded-gop-sm [&_code]:bg-gop-ink/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[14px] [&_code]:text-gop-ink",
  "[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-[14px] [&_pre]:bg-gop-dark [&_pre]:p-5 [&_pre]:text-[13.5px] [&_pre]:leading-relaxed [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-white/90",
  // tables
  "[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[14px]",
  "[&_th]:border [&_th]:border-gop-ink-hairline [&_th]:bg-gop-surface [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-gop-ink",
  "[&_td]:border [&_td]:border-gop-ink-hairline [&_td]:px-3 [&_td]:py-2",
  // rules
  "[&_hr]:my-9 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-gop-ink-hairline",
].join(" ");

export default function ProseArticle({ html }: { html: string }) {
  return <div className={PROSE} dangerouslySetInnerHTML={{ __html: sanitize(html) }} />;
}
