import { ArrayNotEmpty, IsArray, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OmitType } from '@nestjs/swagger';
import { Tool } from '../../library/entities/tools.entity';

export enum InputType {
	TASK = 'task',
	PRE_PROMPT = 'pre-prompt',
	READY_PROMPT = 'ready-prompt',
}

export const INPUT_TYPES = Object.values(InputType);

export type OutputType = 'text' | 'image' | 'code' | 'all';

export const OUTPUT_TYPES: OutputType[] = ['text', 'image', 'code', 'all'];

export class InternalAiResult {
	'input': string;
	'prompt-body': string;
	'icon': string;
	'page-name': string;
	'how-to-use': string;
	'prompt-name': string;
	'what-prompt-does': string;
	'description': string;
	'tips': string;
	'seo-description': string;
	'html': string;
	'example-input': string;
	'example-output': string;
	'tools': Tool[];
}

export class InternalProcessRequest {
	@IsNotEmpty({ message: 'input is required' })
	@IsString({ message: 'input must be a string' })
	input: string;

	@IsNotEmpty({ message: 'input_type is required' })
	@IsString({ message: 'input_type must be a string' })
	@IsIn(INPUT_TYPES, { message: `input_type must be one of: ${INPUT_TYPES.join(', ')}` })
	input_type: InputType;

	@IsNotEmpty({ message: 'output_type is required' })
	@IsString({ message: 'output_type must be a string' })
	@IsIn(OUTPUT_TYPES, { message: `output_type must be one of: ${OUTPUT_TYPES.join(', ')}` })
	output_type: OutputType;

	@IsNotEmpty({ message: 'prompt_format is required' })
	@IsString({ message: 'prompt_format must be a string' })
	prompt_format: string;

	@IsArray({ message: 'tools must be an array' })
	@ArrayNotEmpty({ message: 'tools must contain at least one slug' })
	@IsString({ each: true, message: 'each tool must be a string' })
	tools: string[];

	@IsNotEmpty({ message: 'sub_category is required' })
	@IsString({ message: 'sub_category must be a string' })
	sub_category: string;

	@IsNotEmpty({ message: 'page_name is required' })
	@IsString({ message: 'page_name must be a string' })
	page_name: string;

	@IsOptional()
	@IsString({ message: 'screenshot must be a string' })
	screenshot?: string;

	@IsNotEmpty({ message: 'author is required' })
	@IsString({ message: 'author must be a string' })
	author: string;

	@IsOptional()
	@IsString({ message: 'source must be a string' })
	source?: string;
}

export class FormatProcessRequest extends OmitType(InternalProcessRequest, ['input_type'] as const) {
	@IsOptional()
	@IsString({ message: 'prompt_id must be a string' })
	prompt_id?: string;
}
