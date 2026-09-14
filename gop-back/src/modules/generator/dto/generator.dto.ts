import { IsNotEmpty, IsString, IsNumber, Min, MinLength, MaxLength, IsBoolean, IsOptional, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { TaskStatus } from '../../../common/enums';
import { Tool } from '../../library/entities/tools.entity';

export interface ITaskStatusResponse {
	status: TaskStatus;
	prompt_name?: string;
	page_name?: string;
	prompt_body?: string;
}

export class AIResult {
	'task': string;
	'task-generator': string;
	'prompt-body': string;
	'how-to-use': string;
	'tips': string;
	'prompt-name': string;
	'description': string;
	'what-prompt-does': string;
	'icon': string;
	'seo-description': string;
	'example-input': string;
	'tools': Tool[];
	[key: string]: string | Tool[];
}

export class TaskCreationAttrs {
	email: string;
	task: string;
	prompt_type?: number;
}

export class GeneratorBasicAttrs {
	@IsNotEmpty({ message: 'Spend is required' })
	@IsNumber({}, { message: 'Spend must be a number' })
	@Min(0, { message: 'Spend must be greater than or equal to 0' })
	spend: number;

	@IsNotEmpty({ message: 'Event ID is required' })
	@IsString({ message: 'Event ID must be a string' })
	event_id: string;

	@IsNotEmpty({ message: 'Country is required' })
	@IsString({ message: 'Country must be a string' })
	country: string;
}

export class CreateCustomPromptDto {
	@IsNotEmpty({ message: 'Email is required' })
	@IsEmail({}, { message: 'Email must be a valid email' })
	@Transform(({ value }) => value.toLowerCase().trim())
	email: string;

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
	@IsNumber({}, { message: 'Spend must be a number' })
	@Min(0, { message: 'Spend must be greater than or equal to 0' })
	spend?: number;

	@IsOptional()
	@IsString({ message: 'Event ID must be a string' })
	event_id?: string;

	@IsOptional()
	@IsString({ message: 'Country must be a string' })
	country?: string;

	@IsOptional()
	@IsBoolean({ message: 'isPromptPublic value must be a boolean' })
	@Transform(({ value }) => value ?? false)
	isPromptPublic?: boolean = false;

	@IsOptional()
	@IsNumber({}, { message: 'prompt_type must be a number' })
	prompt_type?: number;
}

export class GeneratorAttrs extends GeneratorBasicAttrs {
	@IsNotEmpty({ message: 'Task ID is required' })
	@IsNumber({}, { message: 'Task ID must be a number' })
	@Min(1, { message: 'Task ID must be greater than or equal to 1' })
	task_id: number;
}

export class MakeAiRequestsDto {
	task_id: number;
	task: string;
	prompt_type: number;
}

export class SimpleCustomPromptDto {
	custom_prompt_id: number;
	name: string;
	prompt: string;
	model: string;
	insert: string;
}

export class aiRequestDto {
	task_id: number;
	prompt: SimpleCustomPromptDto;
}
