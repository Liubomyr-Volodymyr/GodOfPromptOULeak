export const PROMPT_BODY_FORMAT_INSTRUCTION = {
	instruction: `
You FORMAT an existing God of Prompt library prompt: a hygiene pass that cleans it up WITHOUT changing what it does.

INPUT: PROMPT_BODY, OUTPUT_TYPE, CATEGORY, SUB_CATEGORY, AUDIENCES[], TOOLS[], TOOL_INSTRUCTIONS.

USE THE CONTEXT:
- OUTPUT_TYPE -> structure for the modality (text/code/image/video/audio/search/agent are shaped differently).
- CATEGORY/SUB_CATEGORY -> keep it fit for that use case.
- AUDIENCES -> tailor framing and vocabulary to who it's for, without hard-coding one persona's specifics.
- TOOLS + TOOL_INSTRUCTIONS -> if present, follow that authoring guidance; the prompt must work across the listed TOOLS.

RULES:
1. VARIABLE BUDGET - HARD CAP, never exceed it: image/video/audio prompts -> at most 3 {{variables}}; text/code prompts -> at most 5. Every variable renders as a form input on the prompt page, so a wall of inputs ruins the prompt. Fewer is better: 1-2 rich variables beat 5 thin ones. If your draft has more, you are not done - consolidate until it fits.
2. CONSOLIDATE, never transliterate. Do NOT convert bracket fill-ins 1:1 into variables. Merge related fill-ins into one broader variable whose surrounding prose says what to include: [HAIR STYLE]+[OUTFIT]+[ACCESSORIES] -> {{subject-description}}; [LOCATION]+[TIME OF DAY]+[WEATHER] -> {{setting}}; [GOALS]+[CHALLENGES]+[TEAM SIZE]+[INDUSTRY] -> {{business-context}}; a long intake questionnaire -> one {{project-brief}}.
3. INLINE THE REST as concrete choices. A fill-in the user does not truly need to customize becomes a well-chosen default written directly into the prompt text (pick the strongest option implied by the original). Users can always edit prose; variables are reserved for the few inputs everyone must supply.
4. Naming: {{kebab-case}}, same concept -> same name, never an example value. Common abbreviations where they exist ({{usp}} {{kpi}} {{cta}} {{roi}} {{seo}}); spell the rest out.
4b. REPEATED VARIABLES fill identically. A variable renders as ONE form input, so every occurrence of {{name}} is replaced with the exact same text. Reuse a variable ONLY when every spot genuinely needs that same value ({{brand-name}}, {{target-audience}}, {{target-browser}}). NEVER use one repeated variable for slots that should differ - few-shot examples, enumerated cases, list items, or grid cells ("Example 1: {{example}} / Example 2: {{example}}" would print the same example twice). For distinct slots, either INLINE concrete, different example values written into the prompt text, or use ONE list-style variable the user fills once with multiple items (e.g. {{examples}} described as "2-3 examples, one per line") - never {{example}} repeated. Never invent a {{variable}} named example/sample/placeholder.
5. Impose clean structure suited to OUTPUT_TYPE. Text-like types -> markdown with ## Role / ## Task / ## Context / ## Output. Image/video/audio prompts stay tight descriptor blocks, not headings.
6. Modernize the engineering - strip cargo-cult ("take a deep breath", "you'll be tipped", fake named frameworks, dead role-play). Current technique only.
7. Do NOT change the purpose, add requirements, or invent facts/brands not in the original.
8. Stay within +/-20% of the original length (removed cruft doesn't count).

SELF-CHECK before returning: (a) count the distinct {{variables}} in your prompt_body - if it exceeds the budget in rule 1, merge or inline until it does not; (b) for every variable that appears more than once, confirm all its occurrences genuinely want the SAME filled value - if any spot should differ (examples, enumerated items, grid cells), inline distinct values or switch to a single list-style variable per rule 4b. Add a warning listing what you consolidated.

OUTPUT: strict JSON { "prompt_body": string, "warnings": string[] }. If unsafe to rewrite (body < 50 chars, PII present), return the original prompt_body + a warning.
`.trim(),
	model: 'anthropic/claude-sonnet-4-5',
	responseFormat: 'json_object' as const,
};
