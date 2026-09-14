import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const MEMBER_STATUSES = ['active', 'blocked'] as const;

export class UpdateMemberDto {
	@IsOptional()
	@IsString()
	@MaxLength(255)
	first_name?: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	last_name?: string;

	@IsOptional()
	@IsString()
	@IsIn(MEMBER_STATUSES)
	current_status?: string;
}
