import { IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PromptStatusEnum } from '../../library/entities/prompts.entity';

export class CreatePromptDto {
	@IsString()
	@IsNotEmpty()
	slug: string;

	@IsString()
	@IsNotEmpty()
	page_name: string;

	@IsString()
	@IsNotEmpty()
	prompt_name: string;

	@IsString()
	@IsNotEmpty()
	prompt_body: string;

	@IsInt()
	output_type_id: number;

	@IsIn(Object.values(PromptStatusEnum))
	status: PromptStatusEnum;

	@IsOptional()
	@IsString()
	icon?: string | null;

	@IsOptional()
	@IsInt()
	category_id?: number | null;

	@IsOptional()
	@IsInt()
	sub_category_id?: number | null;

	@IsOptional()
	@IsInt()
	prompt_format?: number | null;

	@IsOptional()
	@IsInt()
	input_format?: number | null;

	@IsOptional()
	@IsBoolean()
	is_premium?: boolean;

	@IsOptional()
	@IsString()
	description?: string | null;

	@IsOptional()
	@IsString()
	what_this_prompt_does?: string | null;

	@IsOptional()
	@IsString()
	tips?: string | null;

	@IsOptional()
	@IsString()
	how_to_use_the_prompt?: string | null;

	@IsOptional()
	@IsString()
	seo_description?: string | null;

	@IsOptional()
	@IsString()
	input_body?: string | null;

	@IsOptional()
	@IsString()
	example_output_url?: string | null;

	@IsOptional()
	@IsString()
	example_output_embed?: string | null;

	@IsOptional()
	@IsInt()
	author_id?: number | null;

	@IsOptional()
	@IsInt()
	source_id?: number | null;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	tools?: string[];

	@IsOptional()
	@IsArray()
	@IsInt({ each: true })
	audience_type_ids?: number[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	audience_types?: string[];
}
