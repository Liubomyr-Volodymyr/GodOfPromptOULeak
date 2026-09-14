/**
 * Internal Prompt shape — what every consumer (PromptCard, the detail
 * page, etc.) sees AFTER the api/prompts module normalises the backend
 * response. The two backend shapes (snake_case from /api/prompts,
 * camelCase from /api/library/{id}) both collapse into this.
 */
export type PromptTool = {
  id: number | string;
  name: string;          // display name ("ChatGPT", "Claude Code")
  webName: string;       // same as name for now — kept for parity with old API
  techName?: string | null; // model variant ("GPT-5", "Sonnet")
  slug?: string;         // brand-canonical slug ("chatgpt", "claude-code")
  url?: string | null;   // official tool URL from the API ("Open in X" target)
  /** Backend tool type — llm | coding-ai | image-ai | video-ai | audio-ai |
   *  3d-ai | research-ai | automation-saas | productivity-saas. Drives which
   *  tools qualify as an "Open in" destination. */
  type?: string | null;
};

export type PromptCategory = {
  id: number | string;
  name: string;
  slug: string;
};

export type Prompt = {
  id: string;
  slug: string;
  title: string;                       // page_name / pageName
  promptName?: string | null;          // alternate display name
  icon: string | null;                 // emoji string (e.g. "🔍")
  description: string;                 // short one-paragraph lead
  isPremium: boolean;
  views: number;
  likes: number;
  bookmarks: number;
  /** Average user rating 0–5, or null when the prompt has none. The backend
   *  has no ratings field yet, so this is null today; cards render the star
   *  row only when it's a real number. Wire it in transformPrompt when the
   *  field ships — do NOT synthesize a value. */
  rating: number | null;
  heroImage: string | null;            // exampleOutputUrl
  publishedAt: string | null;          // ISO
  category: PromptCategory | null;
  subcategory: PromptCategory | null;
  categoryId: number | null;
  subCategoryId: number | null;
  outputTypeId: number | null;   // 1 = text, 2 = image (dev API)
  /** Backend `output_type` slug — "text" | "image" | "presentation". The
   *  authoritative output type; always present. */
  outputType: string | null;
  /** Body format from the API: "text_prompt" | "json_prompt" | "xml_prompt"
   *  | "image_prompt" | "interactive_prompt". Null when the route doesn't
   *  send the promptFormat object (list items). */
  promptFormat: string | null;
  /** Persona the prompt adopts ("Marketing Manager", "Developer"). Comes
   *  from a backend role field that isn't live yet — null until the API
   *  ships it; the card + browse lens render it only when present. */
  role: string | null;
  roleSlug: string | null;
  tools: PromptTool[];
  body: string | null;                 // prompt_body / promptBody
  whatThisPromptDoes: string | null;
  tips: string | null;
  howToUse: string | null;             // how_to_use_the_prompt / howToUseThePrompt
  seoDescription: string | null;
};
