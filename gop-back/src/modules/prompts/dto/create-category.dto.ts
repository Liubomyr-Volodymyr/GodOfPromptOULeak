import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
	@IsString({ message: 'name must be a string' })
	@MinLength(1, { message: 'name is required' })
	@MaxLength(255, { message: 'name must be at most 255 characters' })
	name: string;

	@IsOptional()
	@Type(() => Number)
	@IsInt({ message: 'parent must be an integer' })
	parent?: number | null;
}
