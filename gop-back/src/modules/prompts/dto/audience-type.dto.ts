import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateAudienceTypeDto {
	@IsString()
	@IsNotEmpty()
	@Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase kebab-case' })
	slug: string;
}

export class UpdateAudienceTypeDto {
	@IsOptional()
	@IsString()
	@Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase kebab-case' })
	slug?: string;
}
