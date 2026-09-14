import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
	@Transform(({ value }) => value?.toLowerCase().trim())
	@IsEmail()
	email: string;

	@IsNotEmpty()
	password: string;
}
