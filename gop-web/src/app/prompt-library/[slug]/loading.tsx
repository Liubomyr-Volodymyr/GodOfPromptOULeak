/**
 * Route-level skeleton for /prompt-library/[slug] — mirrors the article
 * shape (breadcrumb → title → description → the dark terminal block) so
 * uncached navigations paint instantly instead of blocking on the API.
 * Panel heights match the real collapsed render (413px clip + padding,
 * rail min-h 340) so the content swap doesn't shift layout.
 */
export default function PromptDetailLoading() {
  return (
    <div
      role="status"
      aria-busy
      aria-label="Loading prompt"
      className="mx-auto flex w-full max-w-[1200px] animate-pulse flex-col gap-6 px-6 py-20 max-[900px]:py-12 max-[640px]:px-4 max-[640px]:py-6 motion-reduce:animate-none"
    >
      {/* breadcrumb */}
      <div className="h-4 w-48 rounded bg-gop-ink/5" />
      {/* title */}
      <div className="h-8 w-3/4 max-w-[560px] rounded-lg bg-gop-ink/10" />
      {/* date + description */}
      <div className="flex flex-col gap-2">
        <div className="h-4 w-40 rounded bg-gop-ink/5" />
        <div className="h-4 w-full max-w-[560px] rounded bg-gop-ink/5" />
        <div className="h-4 w-2/3 max-w-[400px] rounded bg-gop-ink/5" />
      </div>
      {/* terminal block + attached white taxonomy strip */}
      <div>
        <div className="rounded-t-[16px] bg-[#1b1a1a] p-6 max-[640px]:p-3">
          <div className="mb-4 h-11 rounded-full bg-white/[0.08]" />
          <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-4 max-[960px]:grid-cols-1">
            <div className="h-[413px] rounded-2xl bg-white/[0.02]" />
            <div className="h-[413px] rounded-2xl bg-white/[0.02] max-[960px]:h-[340px]" />
          </div>
        </div>
        <div className="h-20 rounded-b-2xl bg-white max-[640px]:h-14" />
      </div>
    </div>
  );
}
