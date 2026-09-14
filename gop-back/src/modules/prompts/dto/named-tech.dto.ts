import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateNamedTechDto {
	@IsOptional()
	@IsString({ message: 'name must be a string' })
	@MinLength(1, { message: 'name must not be empty' })
	name?: string;

	@IsOptional()
	@IsString({ message: 'techName must be a string' })
	@MinLength(1, { message: 'techName must not be empty' })
	techName?: string;
}
