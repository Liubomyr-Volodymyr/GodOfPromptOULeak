import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SubmitLeadDto {
	@Transform(({ value }) => value?.toLowerCase?.())
	@IsEmail({}, { message: 'Email must be a valid email address' })
	email: string;

	@IsOptional()
	@IsString()
	first_name?: string;

	@IsOptional()
	@IsString()
	last_name?: string;

	@IsOptional()
	@IsString()
	lead_magnet_slug?: string;

	@IsOptional()
	@IsString()
	utm_source?: string;

	@IsOptional()
	@IsString()
	utm_medium?: string;

	@IsOptional()
	@IsString()
	utm_campaign?: string;

	@IsOptional()
	@IsString()
	utm_content?: string;

	@IsOptional()
	@IsString()
	utm_term?: string;
}
