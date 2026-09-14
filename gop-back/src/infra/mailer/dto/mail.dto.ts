import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class SendMailDto {
	@IsEmail()
	@IsNotEmpty()
	to: string;

	@IsString()
	@IsNotEmpty()
	subject: string;

	@IsString()
	@IsNotEmpty()
	template: string;

	@IsObject()
	@IsOptional()
	context?: Record<string, unknown>;
}

export class SendMailByTemplateIdDto {
	@IsEmail()
	@IsNotEmpty()
	to: string;

	templateId: number;

	context?: Record<string, unknown>;
}
