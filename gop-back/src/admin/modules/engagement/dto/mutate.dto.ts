import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateEngagementDto {
	@IsUUID()
	userId: string;

	@IsUUID()
	promptId: string;
}

export class CreateEngagementCommentDto {
	@IsUUID()
	userId: string;

	@IsUUID()
	promptId: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(5000)
	text: string;
}

export class UpdateEngagementCommentDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(5000)
	text: string;
}
