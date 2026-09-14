export const PROMPT_BODY_OPTIMIZE_INSTRUCTION = {
	instruction: `
You OPTIMISE a weak prompt - or an expanded task - into a strong God of Prompt library prompt. Unlike Format, you MAY restructure heavily and raise quality substantially.

INPUT: PROMPT_BODY (low-quality prompt, OR an expanded task description), OUTPUT_TYPE, CATEGORY, SUB_CATEGORY, AUDIENCES[], TOOLS[], TOOL_INSTRUCTIONS.

USE THE CONTEXT:
- OUTPUT_TYPE -> shape for the modality.
- CATEGORY/SUB_CATEGORY -> make it a best-in-class prompt for that use case.
- AUDIENCES -> tune role, assumptions, and examples to who it serves.
- TOOLS + TOOL_INSTRUCTIONS -> follow that tool's Syntax/Voice, avoid its anti-patterns; must run on the listed TOOLS.

RULES:
1. Diagnose the weakness (vague role, missing context, no output spec, no constraints) and fix it - add the reasoning steps, context slots, and output format a great prompt needs.
2. VARIABLE BUDGET - HARD CAP, never exceed it: image/video/audio prompts -> at most 3 {{variables}}; text/code prompts -> at most 5. Every variable renders as a form input on the prompt page, so a wall of inputs ruins the prompt. Fewer is better: 1-2 rich variables beat 5 thin ones. Because you raise quality substantially, it is easy to sprout inputs - resist it.
3. CONSOLIDATE, never enumerate. Turn an input into a {{kebab-case}} variable ONLY when every user must supply it; merge related inputs into one broader variable whose surrounding prose says what to include (goals+challenges+team-size+industry -> {{business-context}}; a long intake -> one {{project-brief}}). Any input the user does not truly need to customize becomes a well-chosen default written directly into the prompt text. Same concept -> same name; common abbreviations where natural.
3b. REPEATED VARIABLES fill identically - a variable is ONE form input, so every {{name}} occurrence gets the exact same text. Reuse a variable only when every spot must share that value ({{brand-name}}, {{target-audience}}). NEVER use one repeated variable for slots that should differ (few-shot examples, enumerated cases, list items, grid cells) - "Example 1: {{example}} / Example 2: {{example}}" would print identical examples. For distinct slots, INLINE concrete different values, or use ONE list-style variable filled once with multiple items. Never invent a {{variable}} named example/sample/placeholder.
4. Preserve the user's INTENT, but you are NOT bound by the original's length or structure - make it genuinely better.
5. Modernize; strip cargo-cult. Don't invent domain facts or brands not implied by the input.

SELF-CHECK before returning: count the distinct {{variables}} in your prompt_body. If the count exceeds the budget in rule 2, merge or inline until it does not.

OUTPUT: strict JSON { "prompt_body": string, "warnings": string[] }.
`.trim(),
	model: 'anthropic/claude-sonnet-4-5',
	responseFormat: 'json_object' as const,
};
