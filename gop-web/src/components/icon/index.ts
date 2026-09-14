/**
 * Icon module barrel.
 *
 *   import Icon from "@/components/icon";
 *   import Icon, { type IconName } from "@/components/icon";
 *
 * For AI tool brand icons (ChatGPT, Claude, Cursor, Windsurf, …) use
 * @lobehub/icons directly — it ships React components with the official
 * brand marks and is more comprehensive than our hand-extracted set.
 *
 *   import { OpenAI, Anthropic, Cursor } from "@lobehub/icons";
 *
 * This module owns everything else (UI icons, custom marks).
 */
export { default } from "./Icon";
export type { IconName } from "./Icon";
