import { IsEnum, IsOptional, IsString, Min } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export enum ProductTypeEnum {
	LEAD_MAGNET = 'lead-magnet',
	PRODUCT = 'product',
}

export class ProductsQueryDto extends PaginationQueryDto {
	@Min(-1)
	limit?: number = 200;

	@Min(0)
	offset?: number = 0;

	@IsOptional()
	@IsString()
	sort?: string = 'name';

	@IsOptional()
	@IsEnum(ProductTypeEnum)
	type?: ProductTypeEnum;
}
