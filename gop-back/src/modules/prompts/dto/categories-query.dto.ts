import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CategoriesQueryDto {
	@IsOptional()
	@IsString()
	type?: 'parent' | 'sub';

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	parentId?: number;
}
