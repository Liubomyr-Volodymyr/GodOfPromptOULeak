import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';
import { AdminRole } from '../../../entities/admins.entity';

export class CreateAdminDto {
	@IsEmail()
	email: string;

	@IsString()
	first_name: string;

	@IsString()
	last_name: string;

	@IsString()
	@MinLength(6)
	password: string;

	@IsString()
	@IsIn(Object.values(AdminRole))
	role: AdminRole;
}
