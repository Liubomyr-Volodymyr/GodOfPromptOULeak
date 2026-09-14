import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class LoginAdminDto {
	@IsNotEmpty()
	@IsEmail()
	email: string;
	@IsStrongPassword()
	password: string;
}
