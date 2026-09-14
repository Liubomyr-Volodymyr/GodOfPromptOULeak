import { IsString } from 'class-validator';

export class AddBookmarkDto {
	@IsString()
	promptId: string;
}
