import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { PROJECT_KEY } from '../../../common/enums';

export class AIRequestDto {
	@IsOptional()
	@IsNumber({}, { message: 'Priority must be a number' })
	@Min(1, { message: 'Priority must be greater than or equal to 1' })
	@Max(10, { message: 'Priority must be less than or equal to 10' })
	priority?: number;

	@IsNotEmpty({ message: 'Prompt is required' })
	@IsString({ message: 'Prompt must be a string' })
	prompt: string;

	@IsOptional()
	@IsString({ message: 'Model must be a string' })
	model?: string;

	@IsNotEmpty({ message: 'Project key is required' })
	@IsString({ message: 'Project key must be a string' })
	project_key: PROJECT_KEY;

	@IsOptional()
	@IsString({ message: 'Tracking ID must be a string' })
	trackingId?: string;

	@IsOptional()
	@IsString({ message: 'Field name must be a string' })
	fieldName?: string;

	@IsOptional()
	@IsString({ message: 'responseFormat must be a string' })
	responseFormat?: 'json_object' | 'text';
}
