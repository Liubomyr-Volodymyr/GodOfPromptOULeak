import { IsEnum, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PromptCreationTypes } from './save-prompt.dto';

export enum PromptStatusFilter {
	PUBLISHED = 'published',
	PENDING = 'pending',
	ALL = 'all',
}

export enum PromptSortField {
	DATE_PUBLISHED = 'date_published',
	VIEWS_COUNT = 'views_count',
}

export enum SortOrder {
	ASC = 'ASC',
	DESC = 'DESC',
}

export class PromptsQueryDto extends PaginationQueryDto {
	@Min(0)
	offset?: number = 0;

	@Min(1)
	@Max(100)
	limit?: number = 24;

	@IsOptional()
	@IsEnum(PromptSortField)
	sort?: PromptSortField = PromptSortField.DATE_PUBLISHED;

	@IsOptional()
	@IsEnum(SortOrder)
	@Transform(({ value }) => value?.toUpperCase())
	order: SortOrder = SortOrder.DESC;

	@IsOptional()
	@IsString()
	categorySlug?: string;

	@IsOptional()
	@IsString()
	subCategorySlug?: string;

	@IsOptional()
	@IsString()
	audienceTypeSlug?: string;

	@IsOptional()
	@Transform(({ value }) => {
		if (!value) return [];
		return Array.isArray(value)
			? value
			: String(value)
					.split(',')
					.map((item) => item.trim());
	})
	tools?: string[];

	@IsOptional()
	@IsString()
	search?: string;

	/**
	 * Filter by output type — matches `output_types.tech_name` (the same value
	 * already serialised as `output_type` on every prompt in the response):
	 * `text` | `image` | `presentation` | …
	 *
	 * Deliberately a lowercased string, not an enum: the `output_types` table
	 * already holds rows beyond the OUTPUT_TYPE const (e.g. `presentation`),
	 * so an enum here would drift and start rejecting valid values. An
	 * unrecognised value simply matches nothing (`meta.total: 0`).
	 */
	@IsOptional()
	@IsString()
	@Transform(({ value }: { value: string }): string | undefined => value?.toLowerCase().trim())
	output_type?: string;

	@IsOptional()
	@IsEnum(PromptCreationTypes)
	@Transform(({ value }: { value: string }): string | undefined => value?.toLowerCase())
	prompt_creation_type?: PromptCreationTypes;

	@IsOptional()
	@IsEnum(PromptStatusFilter)
	@Transform(({ value }: { value: string }): string | undefined => value?.toLowerCase())
	status?: PromptStatusFilter = PromptStatusFilter.PUBLISHED;
}
