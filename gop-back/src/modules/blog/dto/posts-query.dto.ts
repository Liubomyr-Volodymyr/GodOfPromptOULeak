import { IsBooleanString, IsEnum, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export enum PostSortField {
	PUBLISHED_AT = 'published_at',
	CREATED_AT = 'created_at',
	TITLE = 'title',
}

export enum SortOrder {
	ASC = 'ASC',
	DESC = 'DESC',
}

export class PostsQueryDto extends PaginationQueryDto {
	@Min(0)
	offset?: number = 0;

	@Min(1)
	@Max(100)
	limit?: number = 24;

	@IsOptional()
	@IsEnum(PostSortField)
	sort?: PostSortField = PostSortField.PUBLISHED_AT;

	@IsOptional()
	@IsEnum(SortOrder)
	@Transform(({ value }) => value?.toUpperCase())
	order: SortOrder = SortOrder.DESC;

	@IsOptional()
	@IsString()
	categorySlug?: string;

	@IsOptional()
	@IsString()
	tagSlug?: string;

	@IsOptional()
	@IsString()
	audienceTypeSlug?: string;

	@IsOptional()
	@IsString()
	toolSlug?: string;

	@IsOptional()
	@IsBooleanString()
	featured?: string;

	@IsOptional()
	@IsString()
	search?: string;
}
