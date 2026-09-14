import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCommentDto {
	@IsString()
	@IsNotEmpty()
	promptId: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(5000)
	text: string;
}
