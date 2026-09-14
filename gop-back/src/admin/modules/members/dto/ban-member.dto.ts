import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BanMemberDto {
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsString()
	@IsOptional()
	reason: string | null;
}
