import { IsArray, IsBoolean, IsIn, IsInt, IsISO8601, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatusEnum } from '../entities/post.entity';
import { SeoStatusEnum } from '../../library/entities/categories.entity';
import { FaqItemDto, InternalLinkDto } from './create-post.dto';

export class ImportTagRefDto {
	@IsString()
	@IsNotEmpty()
	slug: string;

	@IsOptional()
	@IsString()
	name?: string;
}

export class ImportPostDto {
	@IsString()
	@IsNotEmpty()
	slug: string;

	@IsString()
	@IsNotEmpty()
	title: string;

	@IsOptional()
	@IsString()
	excerpt?: string | null;

	@IsOptional()
	@IsString()
	body?: string;

	@IsOptional()
	@IsString()
	cover_image_url?: string | null;

	@IsOptional()
	@IsIn(Object.values(PostStatusEnum))
	status?: PostStatusEnum;

	@IsOptional()
	@IsBoolean()
	featured?: boolean;

	@IsOptional()
	@IsInt()
	reading_time_minutes?: number | null;

	@IsOptional()
	@IsString()
	category_slug?: string | null;

	@IsOptional()
	@IsString()
	category_name?: string | null;

	@IsOptional()
	@IsString()
	author_slug?: string | null;

	@IsOptional()
	@IsString()
	author_name?: string | null;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ImportTagRefDto)
	tags?: ImportTagRefDto[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	audience_type_slugs?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	tool_slugs?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	related_post_slugs?: string[];

	@IsOptional()
	@IsString()
	seo_title?: string | null;

	@IsOptional()
	@IsString()
	seo_description?: string | null;

	@IsOptional()
	@IsString()
	canonical_url?: string | null;

	@IsOptional()
	@IsString()
	og_image_url?: string | null;

	@IsOptional()
	@IsIn(Object.values(SeoStatusEnum))
	seo_status?: SeoStatusEnum;

	@IsOptional()
	@IsString()
	schema_type?: string;

	@IsOptional()
	@IsString()
	focus_keyword?: string | null;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => FaqItemDto)
	faq_items?: FaqItemDto[] | null;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => InternalLinkDto)
	internal_links?: InternalLinkDto[] | null;

	@IsOptional()
	@IsISO8601({}, { message: 'published_at must be an ISO 8601 date string' })
	published_at?: string | null;

	@IsOptional()
	@IsISO8601({}, { message: 'modified_at must be an ISO 8601 date string' })
	modified_at?: string | null;
}

export class ImportPostsDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ImportPostDto)
	posts: ImportPostDto[];

	@IsOptional()
	@IsBoolean()
	create_missing_taxonomy?: boolean;
}
