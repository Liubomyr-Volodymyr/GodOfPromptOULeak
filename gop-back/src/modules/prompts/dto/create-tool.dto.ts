import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateToolDto {
	@IsString({ message: 'name must be a string' })
	@MinLength(1, { message: 'name is required' })
	@MaxLength(255, { message: 'name must be at most 255 characters' })
	name: string;

	@IsString({ message: 'slug must be a string' })
	@MinLength(1, { message: 'slug is required' })
	@MaxLength(255, { message: 'slug must be at most 255 characters' })
	slug: string;

	@IsOptional()
	@IsString({ message: 'public_id must be a string' })
	public_id?: string | null;

	@IsOptional()
	@IsString({ message: 'description must be a string' })
	description?: string | null;

	@IsOptional()
	@IsUrl({}, { message: 'url must be a valid URL' })
	url?: string | null;

	@IsOptional()
	@IsString({ message: 'type must be a string' })
	type?: string | null;

	@IsOptional()
	@IsInt({ message: 'parent_id must be an integer' })
	parent_id?: number | null;

	@IsOptional()
	@IsString({ message: 'title must be a string' })
	title?: string | null;

	@IsOptional()
	@IsString({ message: 'h1 must be a string' })
	h1?: string | null;

	@IsOptional()
	@IsString({ message: 'seo_description must be a string' })
	seo_description?: string | null;

	@IsOptional()
	@IsString({ message: 'behavior must be a string' })
	behavior?: string | null;

	@IsOptional()
	@IsString({ message: 'tips must be a string' })
	tips?: string | null;

	@IsOptional()
	@IsString({ message: 'how_to_use must be a string' })
	how_to_use?: string | null;

	@IsOptional()
	@IsString({ message: 'best_for must be a string' })
	best_for?: string | null;

	@IsOptional()
	@IsString({ message: 'icon must be a string' })
	icon?: string | null;

	@IsOptional()
	@IsString({ message: 'hero_image_url must be a string' })
	hero_image_url?: string | null;

	@IsOptional()
	@IsString({ message: 'screenshot_image_url must be a string' })
	screenshot_image_url?: string | null;

	@IsOptional()
	@IsString({ message: 'pricing_model must be a string' })
	pricing_model?: string | null;

	@IsOptional()
	@IsString({ message: 'pricing_summary must be a string' })
	pricing_summary?: string | null;

	@IsOptional()
	@IsString({ message: 'plb_instructions must be a string' })
	plb_instructions?: string | null;

	@IsOptional()
	@IsBoolean({ message: 'supports_variables must be a boolean' })
	supports_variables?: boolean;

	@IsOptional()
	@IsDateString({}, { message: 'published_at must be an ISO date string' })
	published_at?: string | null;

	@IsOptional()
	@IsDateString({}, { message: 'last_reviewed_at must be an ISO date string' })
	last_reviewed_at?: string | null;
}
