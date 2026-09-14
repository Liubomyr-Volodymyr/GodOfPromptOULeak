import { IsString } from 'class-validator';

export class SavingPromptDto {
	@IsString()
	promptId: string;

	@IsString()
	folderId: string;
}
