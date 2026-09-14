import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class QdrantFields {
	@IsString()
	@IsNotEmpty()
	page_name: string;

	@IsString()
	@IsNotEmpty()
	prompt_body: string;

	@IsString()
	@IsNotEmpty()
	description: string;
}

export class AddDataDto {
	@IsUUID()
	@IsNotEmpty()
	id: string;

	@IsNumber()
	@IsNotEmpty()
	category: number;

	@IsNumber()
	@IsNotEmpty()
	sub_category: number;

	@ValidateNested()
	@Type(() => QdrantFields)
	fields: QdrantFields;
}

export class SearchDataDto {
	@IsString({ message: 'search must be a string' })
	@IsNotEmpty({ message: 'search must not be empty' })
	search: string;

	@IsNumber({}, { message: 'category must be a number' })
	@Min(1, { message: 'category must be greater than 0' })
	@IsOptional()
	category?: number;

	@IsNumber({}, { message: 'sub_category must be a number' })
	@Min(1, { message: 'sub_category must be greater than 0' })
	@IsOptional()
	sub_category?: number;
}

export class SyncPromptsDto {
	@IsNumber()
	@IsNotEmpty()
	limit: number;

	@IsNumber()
	@IsNotEmpty()
	page: number;

	@IsString()
	@IsOptional()
	dateUpdatedGte?: string;
}
