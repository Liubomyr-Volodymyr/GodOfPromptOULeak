import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateTagDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsString()
	@IsNotEmpty()
	@Matches(SLUG_REGEX, { message: 'slug must be kebab-case (lowercase letters, numbers and dashes)' })
	slug: string;

	@IsOptional()
	@IsBoolean()
	noindex?: boolean;
}

export class UpdateTagDto {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	name?: string;

	@IsOptional()
	@IsString()
	@Matches(SLUG_REGEX, { message: 'slug must be kebab-case (lowercase letters, numbers and dashes)' })
	slug?: string;

	@IsOptional()
	@IsBoolean()
	noindex?: boolean;
}
