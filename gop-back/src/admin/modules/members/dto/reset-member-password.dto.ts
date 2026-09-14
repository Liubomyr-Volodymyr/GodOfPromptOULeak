import { IsNotEmpty, IsString } from 'class-validator';

export class ResetMemberPasswordDto {
	@IsString()
	@IsNotEmpty()
	memberId: string;
	@IsString()
	newPassword: string;
}
