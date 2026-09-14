import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { OUTPUT_TYPES, OutputType } from './internal-prompts.dto';

/**
 * Regenerate the DESCRIBE (guide + SEO) fields for an EXISTING library prompt.
 * The prompt body already exists; this re-runs fields-generation against it and
 * persists description / seo_description / what_this_prompt_does / tips /
 * how_to_use_the_prompt / icon. Context (output_type, sub_category, prompt_format)
 * is optional — passed for accuracy, falls back to sensible defaults.
 */
export class DescribeRequest {
	@IsNotEmpty({ message: 'prompt_id is required' })
	@IsUUID('4', { message: 'prompt_id must be a UUID' })
	prompt_id: string;

	@IsOptional()
	@IsString()
	@IsIn(OUTPUT_TYPES, { message: `output_type must be one of: ${OUTPUT_TYPES.join(', ')}` })
	output_type?: OutputType;

	@IsOptional()
	@IsString()
	sub_category?: string;

	@IsOptional()
	@IsString()
	prompt_format?: string;
}
