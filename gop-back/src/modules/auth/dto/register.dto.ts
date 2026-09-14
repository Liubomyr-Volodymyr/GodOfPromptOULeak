import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TrackingInfoDto } from './tracking.dto';

export class RegisterDto {
	@IsString()
	@IsNotEmpty()
	first_name: string;

	@IsString()
	@IsNotEmpty()
	last_name: string;

	@IsOptional()
	@IsString()
	full_name?: string;

	@Transform(({ value }) => value?.toLowerCase().trim())
	@IsEmail()
	email: string;

	@IsString()
	@MinLength(6)
	password: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => TrackingInfoDto)
	tracking?: TrackingInfoDto;

	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => Boolean(value))
	product_updates?: boolean;

	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => Boolean(value))
	marketing_emails?: boolean;
}
