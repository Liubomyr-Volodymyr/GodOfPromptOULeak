# God of Prompt — Design System (gop-web)

Source of truth: Figma `x-gop-design-system` (file `bdAL0iOuyC2BIytvfYHvZj`) + Tailwind v4 `@theme` tokens in `src/app/globals.css`. This file is the agent-readable summary; when in doubt, the Figma file and globals.css win.

## 1. Color tokens

### Brand
| Token | Hex | Usage |
|---|---|---|
| `gop-gold` | `#FDC302` | Primary brand gold — ALWAYS a fill (buttons, chips), NEVER text on light backgrounds |
| `gop-gold-dark` | `#B88800` | Gold hover/pressed |
| `gop-dark` | `#2D2B2C` | Dark surfaces: navbar pill, prompt cards, prompt block |
| `gop-ink` | `#161415` | Primary text on light |
| `gop-page` | `#F5F5F5` | Page background (light pages); page wrappers stay `transparent` — only cards carry surface colors |

### Semantic (dark surfaces — prompt block, cards)
| Token | Value | Usage |
|---|---|---|
| text/inverse | `#F7F7F7` | Primary text on dark |
| icon/inverse | `#F7F7F7` | Icons on dark |
| icon/active | `#FCD94A` | Active/focus accent on dark (NOT #FDC302 — dark surfaces use the lighter gold) |
| textfield/bg | `rgba(255,255,255,0.04)` (`#ffffff0a`) | Input fills on dark |
| textfield/stroke | `rgba(255,255,255,0.04)` | Input border, regular |
| textfield/stroke-focus | `#FCD94A` | Input border, focused |
| textfield/placeholder | `rgba(255,255,255,0.75)` | Placeholder text on dark |
| card border | `rgba(255,255,255,0.14)` | Card hairline on dark |

### Semantic (light surfaces)
| Token | Hex | Usage |
|---|---|---|
| text/primary | `#1B1A1A` | Headings, body |
| text/secondary | `#4F4E4F` | Secondary copy |
| icon/secondary | `#6F6E6F` | Muted icons |

### Model brand colors (chips/plaques only)
chatgpt, claude `#FF7043`, gemini (gradient), grok, deepseek, midjourney, nano-banana (gold fill + off-white text), notebooklm `#1A73E8`. Defined as `--color-gop-model-*` in globals.css; rendered ONLY via the `ToolChip` component with lobehub icons.

## 2. Typography

- Family: **Roboto** (only family — headings and body)
- Headings: bold (700), tight letter-spacing (−0.5px on h-level sizes). h7 = 32/40 bold.
- Body: regular (400). base = 16/24 · small = 14/20 · caption/hint = 11/16 (+0.2px tracking)
- Prompt body text (inside the prompt block) renders in a **monospace** stack to read like a terminal/code document; `#SECTION:` headers and `[Placeholder]` tokens highlighted (placeholder = gold `#FDC302`-tinted pill on dark).

## 3. Spacing + layout

- Content max width: **1180px**, px-24 gutters (px-6 Tailwind)
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32
- Radius: cards **20px**, panels/sidebar **24px**, inputs/chips **8px** (`rounded-gop-sm`), buttons/pills **999** (full)
- Buttons: small = 32px tall, md = 44px (DS standard), gap 4, side padding 8; primary bg `#242223` with 1px white stroke ring + white ellipse blur effect; gold button = solid `#FDC302`
- Dark cards get a soft top radial glow (`rgba(255,255,255,0.12)` → transparent)

## 4. Component patterns

- **Buttons**: use existing DS components (Figma 516-3947). Never reinvent. Variants: gold (primary CTA), primary (dark), small/pill.
- **ToolChip** (`src/components/prompts/ToolChip.tsx`): brand-color model pill, sizes sm 22px / md 32px / lg 40px, lobehub mono icon + name.
- **PromptCard**: dark `#2D2B2C`, rounded-20, white/14 border, top glow, title (emoji + name), 2-line description, brand ToolChips row (+N overflow), audience tag, views footer.
- **Prompt block** (Figma 1266-4591, "terminal" pattern): dark rounded panel with (a) header bar — `>-` gold glyph + prompt name + icon actions right; (b) monospace prompt body with `#CONTEXT:`/`#GOAL:` section headers and gold placeholder pills; (c) optional example-output image inset; (d) right rail "Fill in the variables" — labeled dark textfields (focus = `#FCD94A` ring) + "Generate a custom prompt" footer action.
- **FilterSidebar**: white rounded-24 card, accordion groups, rows = real links with counts.
- Icons: **lucide** for UI, **lobehub** for model brands. Prompt emoji comes from data (the `icon` field), never invented.

## 5. Hard rules

1. Gold is a fill, not light-bg text. No dark→yellow gradients — DS gold is solid.
2. Page wrappers `background: transparent`; the global DotsBg sits at z-index −1; only cards carry surface colors.
3. Never inline brand hex in components — tokens live in `globals.css` `@theme`.
4. CSS-only animation where possible (CWV); no framer-motion on critical paths.
