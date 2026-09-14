import { IsNotEmpty, IsString } from 'class-validator';

export class SupportListDto {
	@IsString()
	@IsNotEmpty()
	subject: string;

	@IsString()
	@IsNotEmpty()
	message: string;
}
