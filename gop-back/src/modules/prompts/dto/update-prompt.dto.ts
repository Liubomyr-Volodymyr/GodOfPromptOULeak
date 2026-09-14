import { IsArray, IsBoolean, IsIn, IsInt, IsISO8601, IsOptional, IsString } from 'class-validator';
import { PromptStatusEnum } from '../../library/entities/prompts.entity';

export class UpdatePromptDto {
	@IsOptional()
	@IsString({ message: 'slug must be a string' })
	slug?: string;

	@IsOptional()
	@IsString({ message: 'page_name must be a string' })
	page_name?: string;

	@IsOptional()
	@IsString({ message: 'prompt_name must be a string' })
	prompt_name?: string;

	@IsOptional()
	@IsString({ message: 'prompt_body must be a string' })
	prompt_body?: string;

	@IsOptional()
	@IsInt({ message: 'output_type_id must be an integer' })
	output_type_id?: number;

	@IsOptional()
	@IsString({ message: 'icon must be a string' })
	icon?: string | null;

	@IsOptional()
	@IsInt({ message: 'category_id must be an integer' })
	category_id?: number | null;

	@IsOptional()
	@IsInt({ message: 'sub_category_id must be an integer' })
	sub_category_id?: number | null;

	@IsOptional()
	@IsInt({ message: 'prompt_format must be an integer' })
	prompt_format?: number | null;

	@IsOptional()
	@IsInt({ message: 'input_format must be an integer' })
	input_format?: number | null;

	@IsOptional()
	@IsBoolean({ message: 'is_premium must be a boolean' })
	is_premium?: boolean;

	@IsOptional()
	@IsIn(Object.values(PromptStatusEnum), { message: `status must be one of: ${Object.values(PromptStatusEnum).join(', ')}` })
	status?: PromptStatusEnum;

	@IsOptional()
	@IsISO8601({}, { message: 'date_published must be an ISO-8601 date' })
	date_published?: string | null;

	@IsOptional()
	@IsString({ message: 'description must be a string' })
	description?: string | null;

	@IsOptional()
	@IsString({ message: 'what_this_prompt_does must be a string' })
	what_this_prompt_does?: string | null;

	@IsOptional()
	@IsString({ message: 'tips must be a string' })
	tips?: string | null;

	@IsOptional()
	@IsString({ message: 'how_to_use_the_prompt must be a string' })
	how_to_use_the_prompt?: string | null;

	@IsOptional()
	@IsString({ message: 'seo_description must be a string' })
	seo_description?: string | null;

	@IsOptional()
	@IsString({ message: 'input_body must be a string' })
	input_body?: string | null;

	@IsOptional()
	@IsString({ message: 'example_output_url must be a string' })
	example_output_url?: string | null;

	@IsOptional()
	@IsString({ message: 'example_output_embed must be a string' })
	example_output_embed?: string | null;

	@IsOptional()
	@IsInt({ message: 'author_id must be an integer' })
	author_id?: number | null;

	@IsOptional()
	@IsInt({ message: 'source_id must be an integer' })
	source_id?: number | null;

	@IsOptional()
	@IsArray({ message: 'tools must be an array of slugs' })
	@IsString({ each: true, message: 'each tool must be a string slug' })
	tools?: string[];

	@IsOptional()
	@IsArray({ message: 'audience_type_ids must be an array of integers' })
	@IsInt({ each: true, message: 'each audience_type_id must be an integer' })
	audience_type_ids?: number[];
}
