import { IsString, Matches } from 'class-validator';

export class UploadImageDto {
	@IsString()
	@Matches(/^[a-z0-9-]+$/, { message: 'folder must contain only lowercase letters, digits and dashes' })
	folder: string;
}
