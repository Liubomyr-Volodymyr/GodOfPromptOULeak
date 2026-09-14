import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateNotificationDto {
	@IsString()
	title: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsString()
	image?: string;

	@IsOptional()
	@IsString()
	author?: string;

	@IsOptional()
	@IsUUID()
	userId?: string;

	@IsOptional()
	@IsUUID()
	segmentId?: string;
}
