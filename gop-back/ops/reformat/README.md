# PLB reformat task — pending prompts

`reformat-task.json` is the work list for reformatting the God of Prompt library through the
internal generator. It is the set of prompts the relink pass flagged `verdict: reformat` that
have **not** yet been reformatted (`date_updated` is null).

## Contents

- **4,059 prompts** — `text` 4,041 · `image` 17 · `code` 1
- Each row: `prompt_id`, `slug`, `page_name`, `output_type`, `prompt_format`, `sub_category`,
  `author`, `tools` (slug strings), `input_type: "ready-prompt"`.
- **Bodies are NOT embedded** (they were 43 MB inline). Fetch `prompt_body` by `prompt_id` from
  the dev catalog at run time. The lean list keeps the file committable (~1.7 MB).

## How to run

Feed each row to the internal generator as a **format** request (`input_type: "ready-prompt"`),
supplying `input` = the prompt's current `prompt_body` (fetched by `prompt_id`):

```
POST /api/generator/internal
x-api-key: <API_KEY>
{
  "input": "<current prompt_body>",
  "input_type": "ready-prompt",
  "output_type": "<row.output_type>",
  "prompt_format": "<row.prompt_format>",
  "tools": <row.tools>,
  "sub_category": "<row.sub_category>",
  "page_name": "<row.page_name>",
  "author": "<row.author>"
}
```

Persist the returned `prompt-body` + fields back to the prompt and stamp `date_updated`
(the reformattedness signal — a plain manual column, so the persist step must set it explicitly).

Throttle: the generator controller is capped at 30 requests / 60 s.

## What the reformat now enforces (deployed 7578feb)

- **Variable budget** — image/video/audio ≤ 3 `{{variables}}`, text/code ≤ 5.
- **No repeated-for-distinct variables** — a `{{variable}}` fills identically everywhere, so
  few-shot example slots / enumerated items become one list-style variable, never `{{example}}×N`.
- Cleanup of legacy `[BRACKET]` placeholders, `●` glyphs, and "mega-prompt" language.

## Code-type pass (done 2026-07-26)

Before building this list, the 460 Coding-category prompts were classified by output:
**236 code / 224 text**, and the 236 code-output prompts were set to `output_type = code`
(id 3) in the catalog. `code-type-classification.json` is the per-prompt result. Most of those
236 were already reformatted (as text) in the earlier bulk run, so only 1 appears in this
pending list — the type is corrected regardless, which is what `/type/code` filtering needs.

`output_types` already has `video` (6) and `audio` (7) seeded for incoming prompts.
