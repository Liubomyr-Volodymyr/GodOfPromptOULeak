import { IsString } from 'class-validator';

export class AddLikeDto {
	@IsString()
	promptId: string;
}
