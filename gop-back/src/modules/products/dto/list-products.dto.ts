import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus, ProductType } from '../../user-products/entities/products.entity';
import { SortOrder } from '../../../common/enums';

export class ListProductsDto {
	@ApiPropertyOptional({ enum: ProductType })
	@IsOptional()
	@IsEnum(ProductType, { message: 'type must be plan, addon, lead-magnet or guide' })
	type?: ProductType;

	@ApiPropertyOptional({ enum: ProductStatus })
	@IsOptional()
	@IsEnum(ProductStatus, { message: 'status must be draft, published or archived' })
	status?: ProductStatus;

	@ApiPropertyOptional({ description: 'ILIKE match against name and description' })
	@IsOptional()
	@IsString({ message: 'search must be a string' })
	search?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString({ message: 'slug must be a string' })
	slug?: string;

	@ApiPropertyOptional({ default: 20, minimum: 1 })
	@IsOptional()
	@Type(() => Number)
	@IsInt({ message: 'limit must be an integer' })
	@Min(1, { message: 'limit must be at least 1' })
	limit?: number = 20;

	@ApiPropertyOptional({ default: 0, minimum: 0 })
	@IsOptional()
	@Type(() => Number)
	@IsInt({ message: 'offset must be an integer' })
	@Min(0, { message: 'offset must be at least 0' })
	offset?: number = 0;

	@ApiPropertyOptional({ enum: ['createdAt', 'name'], default: 'createdAt' })
	@IsOptional()
	@IsIn(['createdAt', 'name'], { message: 'sortBy must be createdAt or name' })
	sortBy?: 'createdAt' | 'name';

	@ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
	@IsOptional()
	@IsEnum(SortOrder, { message: 'order must be a valid sort order' })
	order?: SortOrder;
}
