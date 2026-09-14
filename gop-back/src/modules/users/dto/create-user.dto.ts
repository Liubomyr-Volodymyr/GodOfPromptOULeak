import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
	@IsNotEmpty()
	@IsString()
	first_name: string;

	@IsNotEmpty()
	@IsString()
	last_name: string;

	@IsNotEmpty()
	@IsEmail()
	email: string;

	@IsNotEmpty()
	@IsString()
	password?: string;

	@IsOptional()
	product_updates?: boolean;

	@IsOptional()
	marketing_emails?: boolean;
}
