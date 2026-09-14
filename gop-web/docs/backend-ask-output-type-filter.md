# Backend ask — accept `output_type` as a filter on `GET /api/library/prompts`

**Repo:** gop-back · **Effort:** ~4 lines (the DB join already exists) · **Risk:** none (new optional param, no behaviour change when omitted)

## Problem

`output_type` is returned on every prompt and is **100% populated**:

| value | count | share |
|---|---|---|
| text | 5,890 | 88.8% |
| image | 743 | 11.2% |
| presentation | 1 | — |
| null | 0 | — |
| **total** | **6,634** | |

But it is **not accepted as a filter**:

```
GET /api/library/prompts?output_type=image&limit=1
→ 400 {"message":"property output_type should not exist"}
```

Accepted params today: `offset, limit, sort, order, categorySlug, subCategorySlug,
audienceTypeSlug, tools, search, prompt_creation_type, status`.

**Consequence on the frontend:** `/prompt-library/type/image` can't filter server-side or
show a count (it renders prompts but no number), the filter dropdowns can't show text/image
counts, the H1 can't say "N ChatGPT Text Prompts", and `type × category` / `type × model`
pages can't be built. The frontend only ever receives one page, so it cannot compute the
total itself — counting by paging the whole catalogue measured **~143s and gets HTTP 403**
when parallelised.

## Requested change

Accept an optional `output_type` filter, reflected in `meta.total`:

```
GET /api/library/prompts?output_type=image&limit=1
→ { "data": [...], "meta": { "total": 743, "limit": 1, "offset": 0 } }
```

- **param:** `output_type` (string, optional)
- **values:** `text` | `image` | `presentation` (match `output_types.tech_name`, the value
  already serialised into the response)
- **must compose** with `categorySlug` / `subCategorySlug` / `audienceTypeSlug` / `tools`
  (e.g. `tools=chatgpt&output_type=text` → count of ChatGPT text prompts)
- **must be reflected in `meta.total`** — that's the whole point of the ask

## Implementation

**1. `src/modules/prompts/dto/prompts-query.dto.ts`** — add the field to `PromptsQueryDto`
(the global `ValidationPipe` runs with `forbidNonWhitelisted`, which is why it 400s today):

```ts
export enum PromptOutputType {
	TEXT = 'text',
	IMAGE = 'image',
	PRESENTATION = 'presentation',
}

// …inside PromptsQueryDto
@IsOptional()
@IsEnum(PromptOutputType)
@Transform(({ value }: { value: string }): string | undefined => value?.toLowerCase())
output_type?: PromptOutputType;
```

**2. `src/modules/prompts/helpers/prompts-query.builder.ts`** — the `outputType` relation is
**already joined** (line 24: `.leftJoinAndSelect('prompt.outputType', 'outputType')`), so the
filter is one block alongside the existing `categorySlug` / `tools` ones (lines 39–60):

```ts
if (dto.output_type) {
	qb.andWhere('outputType.tech_name = :output_type', { output_type: dto.output_type });
}
```

> Use whichever column name the entity maps `techName` to — `library.service.ts` already
> reads `outputType?.techName` when serialising the response, so the values line up.

**3. `src/modules/prompts/docs/api-prompts-library.decorator.ts`** — add the `@ApiQuery` entry
so it appears in `/api/docs` (and in the OpenAPI spec the frontend reads).

## Acceptance

```bash
curl -s ".../api/library/prompts?limit=1&output_type=image" | jq .meta.total   # 743
curl -s ".../api/library/prompts?limit=1&output_type=text"  | jq .meta.total   # 5890
curl -s ".../api/library/prompts?limit=1&output_type=bogus"                    # 400
curl -s ".../api/library/prompts?limit=1&tools=chatgpt&output_type=text" | jq .meta.total
curl -s ".../api/library/prompts?limit=1" | jq .meta.total                     # 6634 (unchanged)
```

## Frontend is already shaped for it

`fetchOptionCountMap(axis, slugs)` in `src/lib/api/counts.ts` and `/api/counts` take an axis —
adding `type` is a two-line change the day this ships. Counts then animate in the dropdowns
exactly like category/tool/audience do today.

## Also worth fixing while in here (separate, smaller)

`GET /api/library/facets` does not exist but the path resolves to `/api/library/{id}` and
answers `400 "Validation failed (uuid is expected)"` — a confusing error for a route that
should simply 404. The frontend no longer calls it.
