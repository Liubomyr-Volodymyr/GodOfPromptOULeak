import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export enum ReviewSortField {
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
	STARS_AMOUNT = 'stars_amount',
}

export enum SortOrder {
	ASC = 'ASC',
	DESC = 'DESC',
}

export class ReviewsQueryDto extends PaginationQueryDto {
	@Min(0)
	offset?: number = 0;

	@Min(1)
	@Max(100)
	limit?: number = 24;

	@IsOptional()
	@IsEnum(ReviewSortField)
	sort?: ReviewSortField = ReviewSortField.CREATED_AT;

	@IsOptional()
	@IsEnum(SortOrder)
	@Transform(({ value }) => value?.toUpperCase())
	order: SortOrder = SortOrder.DESC;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(5)
	min_stars?: number;
}
