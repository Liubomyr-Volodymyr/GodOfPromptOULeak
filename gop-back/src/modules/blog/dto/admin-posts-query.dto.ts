import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PostStatusEnum } from '../entities/post.entity';
import { SortOrder } from './posts-query.dto';

export enum AdminPostSortField {
	PUBLISHED_AT = 'published_at',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
	TITLE = 'title',
}

export class AdminPostsQueryDto extends PaginationQueryDto {
	@Min(0)
	offset?: number = 0;

	@Min(1)
	@Max(100)
	limit?: number = 24;

	@IsOptional()
	@IsEnum(AdminPostSortField)
	sort?: AdminPostSortField = AdminPostSortField.CREATED_AT;

	@IsOptional()
	@IsEnum(SortOrder)
	@Transform(({ value }) => value?.toUpperCase())
	order: SortOrder = SortOrder.DESC;

	@IsOptional()
	@IsEnum(PostStatusEnum)
	status?: PostStatusEnum;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	authorId?: number;

	@IsOptional()
	@IsString()
	search?: string;
}
