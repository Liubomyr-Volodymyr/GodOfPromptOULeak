import { IsOptional, IsString, Min } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ItemsQueryDto extends PaginationQueryDto {
	@IsOptional()
	@IsString()
	fields?: string;

	@Min(-1)
	limit?: number;
}
