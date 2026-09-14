import {
	IsArray,
	IsBoolean,
	IsIn,
	IsInt,
	IsISO8601,
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatusEnum } from '../entities/post.entity';
import { SeoStatusEnum } from '../../library/entities/categories.entity';

export class InternalLinkDto {
	@IsString()
	@IsNotEmpty()
	anchor: string;

	@IsString()
	@IsNotEmpty()
	url: string;
}

export class FaqItemDto {
	@IsString()
	@IsNotEmpty()
	question: string;

	@IsString()
	@IsNotEmpty()
	answer: string;
}

export class CreatePostDto {
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
	@IsInt()
	author_id?: number | null;

	@IsOptional()
	@IsInt()
	category_id?: number | null;

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
	@IsUUID('all', { each: true })
	related_post_ids?: string[] | null;

	@IsOptional()
	@IsISO8601({}, { message: 'modified_at must be an ISO 8601 date string' })
	modified_at?: string | null;

	@IsOptional()
	@IsBoolean()
	seo_index?: boolean;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	keywords?: string[];

	// reason: free-form SEO/analytics bag; shape not fixed at the type level
	@IsOptional()
	@IsObject()
	metadata?: Record<string, unknown>;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => InternalLinkDto)
	internal_links?: InternalLinkDto[] | null;

	@IsOptional()
	@IsISO8601({}, { message: 'published_at must be an ISO 8601 date string' })
	published_at?: string | null;

	@IsOptional()
	@IsArray()
	@IsInt({ each: true })
	tag_ids?: number[];

	@IsOptional()
	@IsArray()
	@IsInt({ each: true })
	audience_type_ids?: number[];

	@IsOptional()
	@IsArray()
	@IsInt({ each: true })
	tool_ids?: number[];

	@IsOptional()
	@IsArray()
	@IsUUID('all', { each: true })
	prompt_ids?: string[];

	@IsOptional()
	@IsArray()
	@IsUUID('all', { each: true })
	product_ids?: string[];
}
