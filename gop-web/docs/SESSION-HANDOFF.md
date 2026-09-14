# gop-web — Session Handoff

Resume point so a fresh session needs no scrollback. Pair with
`docs/library-architecture.md` (taxonomy source of truth).

## Ground rules (do not break)
- **Dev only**: localhost data MUST use `https://api-dev.godofprompt.dev`. Never prod/staging for prompt DATA.
- **DotsBackground is sacred**: page wrappers stay `bg-transparent`; the fixed dot canvas sits at z-index -1.
- Branch: `feat/prompt-library-filters` (local only, no push without explicit permission). All work committed.
- Verify with `preview_eval` (DOM), NOT screenshots on dark surfaces (they glitch/black-out). Screenshots also bloat context — prefer DOM checks.

## Dev-api gaps (cause of most "it doesn't work")
- `/api/prompts` (snake_case list) has **no `tools`, no `role`, no `example_output_image`**. → cards use mock tools (ChatGPT/Claude/Gemini), no role byline, grey image placeholder.
- `/api/library/{uuid}` (camelCase) has real `tools[]`.
- Real images live ONLY on **prod**: field `example_output_image` (Directus UUID) → `https://api.godofprompt.dev/api/directus/public/assets/{uuid}`. Wired via `lib/api/base.ts assetUrl()`; lights up automatically when data carries the field.
- No server-side filter/sort/slug params → we fetch a pool and filter/sort client-side; slug lookup scans the list.

## What's built

### Library home `/prompt-library`
- `LibraryDropdownBar`: category **pills** (role-free, 18) + **Output** + **Sort** (Top views / Top likes / Newest) dropdowns. `FilterMenu` = the dropdown primitive.
- `LibraryClient`: client wrapper — sort state + masonry (1/2/3 col) + load-more.
- `PromptCard`: tags = **models + roles** (clickable), grey placeholder for image-type prompts, whole card → **modal popup**, arrow → full page (new tab). `CardHero`, `CardReactions` (like/bookmark localStorage).
- Hero (gold-pill "AI Prompt Library"), live count, search, SEO sections (GridSections + FAQ), 3 JSON-LD blocks.

### Modal popup (intercepting route)
- `app/prompt-library/@modal/(.)[slug]/page.tsx` + `layout.tsx` (parallel `modal` slot) + `@modal/default.tsx`.
- `PromptModal` (overlay) renders shared `PromptArticle` (header, tools, dark IDE panel, meta, info, related). Direct load of the URL = full page.

### Canonical routes (self-canonical, one H1, breadcrumb JSON-LD, ISR 300)
- `/category/[slug]`, `/tool/[slug]`, `/type/[type]`, `/role/[slug]`, and combo `/tool/[slug]/for/[role]`.
- `FilteredLibrary` shared layout (+ `RefineRow` cross-links to combos).

### Taxonomy + data
- `lib/categories.ts` (18 role-free, slug trim), `lib/roles.ts` (25 roles), `lib/taxonomy-graph.ts` (tool↔modality constraints), `getPromptsBy{Category,Type,Tool,Role,ToolAndRole}`.

### Footer + reactive dots (latest chapter)
- `Footer.tsx`: wordmark band transparent (dots show), outline wordmark + gradient fade, content below the divider opaque.
- `DotsBackground.tsx`: dot canvas reacts to shapes — cursor gather; `[data-dots-repel]` repels by true **rounded outline** (border-radius aware); `[data-dots-mask="/x.svg"]` carves the **filled glyph bodies** (flood-filled from the outline SVG); multi-pass repel + drop dots trapped between close items. Tag any element to opt in.

## Unused/dead components from earlier iterations (safe to delete)
GraphNav, LibraryMatrix, FacetRail, LibrarySidebar, CategoryNav, LibraryToolbar — superseded by the dropdown bar. (LibraryToolbar still exports the `Sort` type? No — Sort now lives in LibraryDropdownBar.)

## Open / next
1. Carry the dropdown bar + popup onto the category/tool/role/combo pages (currently `FilteredLibrary` uses `LibraryBrowse`).
2. Real images: only show on prod / when `example_output_image` ships to dev.
3. Backend pending: per-prompt `tools`/`role`, output_types endpoint (9 types), tools index (59).
4. Combo pages: build Category×Tool, Category×Type, Tool×Type templates (Tool×Role done).
5. Optional cleanup: delete the dead components above.
6. The hub's lower "Browse by category" SEO section still lists 19 (incl. solopreneurs) from `prompt-library-hub.json` — trim to 18 when convenient.
