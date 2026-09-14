import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CheckoutSessionAttrs {
	@Transform(({ value }) => value.trim())
	@IsNotEmpty({ message: 'Task is required' })
	@IsString({ message: 'Task must be a string' })
	@MinLength(10, {
		message: 'Task length must be longer than or equal to 10 characters',
	})
	@MaxLength(1000, {
		message: 'Task length must be shorter than or equal to 1000 characters',
	})
	task: string;

	@IsOptional()
	@IsString({ message: 'Access token must be a string' })
	access_token?: string;

	@IsOptional()
	@Transform(({ value }) => value.toLowerCase())
	@IsEmail({}, { message: 'Email must be a valid email' })
	email?: string;

	@IsOptional()
	@IsString({ message: 'Member ID must be a string' })
	member_id?: string;

	@IsOptional()
	@IsNumber({}, { message: 'prompt_type must be a number' })
	prompt_type?: number;
}

export class StripeMetadataDto {
	email: string;
	task_id: number;
	member_id: string;
}

export class CheckoutSessionDto {
	url: string;
	task_id: number;
}

export class StripeSuccessDto {
	received: true;
}
