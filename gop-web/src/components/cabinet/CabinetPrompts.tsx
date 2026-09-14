import Image from "next/image";
import { Bookmark, FileText, Heart, MoreHorizontal, Sparkles } from "lucide-react";

import { CabinetHeading } from "./CabinetShell";
import type { PromptCollection } from "./types";

const ICONS = {
  liked: Heart,
  bookmarks: Bookmark,
  custom: Sparkles,
};

export const DEFAULT_PROMPT_COLLECTIONS: PromptCollection[] = [
  { title: "Liked Prompts", kind: "liked" },
  { title: "Bookmarks", kind: "bookmarks" },
  { title: "Custom Prompts", kind: "custom", count: 14 },
];

function PromptCollectionCard({ collection }: { collection: PromptCollection }) {
  const Icon = ICONS[collection.kind];

  return (
    <article className="relative flex min-h-[214px] min-w-[210px] flex-1 flex-col overflow-hidden rounded-[24px] bg-white/15 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <button
        type="button"
        aria-label={`More options for ${collection.title}`}
        className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold"
      >
        <MoreHorizontal size={18} />
      </button>
      <div className="relative h-[128px]">
        <Image
          src="/images/cabinet/prompt-folder-bg.svg"
          alt=""
          width={205}
          height={174}
          className="absolute left-1/2 top-[-18px] h-[145px] w-[171px] -translate-x-1/2 opacity-75"
        />
        <span className="absolute left-[calc(50%-49px)] top-7 grid h-[74px] w-[54px] -rotate-6 place-items-center rounded-[5px] bg-[#454344] text-white shadow-[0_8px_18px_rgba(0,0,0,0.25)]">
          <FileText size={24} strokeWidth={1.5} />
        </span>
        <span className="absolute left-[calc(50%-4px)] top-5 grid h-[80px] w-[58px] rotate-6 place-items-center rounded-[5px] bg-[#5b595a] text-white shadow-[0_8px_18px_rgba(0,0,0,0.25)]">
          <Icon size={26} strokeWidth={1.5} />
        </span>
      </div>
      <h2 className="m-0 text-[18px] font-medium leading-6 tracking-[-0.4px] text-[#f7f7f7]">
        {collection.title}
      </h2>
      {typeof collection.count === "number" ? (
        <p className="m-0 mt-1 text-[13px] leading-4 text-gop-menu-item-2">
          {collection.count} prompts
        </p>
      ) : null}
    </article>
  );
}

export default function CabinetPrompts({
  collections = DEFAULT_PROMPT_COLLECTIONS,
}: {
  collections?: PromptCollection[];
}) {
  return (
    <>
      <CabinetHeading title="My Prompts" />
      <div className="grid grid-cols-3 gap-3 max-[820px]:grid-cols-2 max-[760px]:grid-cols-1">
        {collections.map((collection) => (
          <PromptCollectionCard key={collection.title} collection={collection} />
        ))}
      </div>
    </>
  );
}
