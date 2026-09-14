import { IsOptional, IsString, IsInt, Min, IsIn, IsArray, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SortOrder } from '../../../../common/enums';

export enum PromptSortBy {
	PROMPT_NAME = 'prompt_name',
	DATE_CREATED = 'date_created',
	DATE_PUBLISHED = 'date_published',
	VIEWS_COUNT = 'views_count',
	LIKES_COUNT = 'likes_count',
	STATUS = 'status',
}

export enum AuthorTypeFilter {
	MODERATOR = 'moderator',
	USER = 'user',
}

export class FindAllPromptsDto {
	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsString()
	moderatorId?: string;

	@IsOptional()
	@IsString()
	@IsIn(Object.values(AuthorTypeFilter))
	authorType?: AuthorTypeFilter;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	limit?: number = 20;

	@IsOptional()
	@IsArray()
	@IsInt({ each: true })
	@Transform(({ value }: { value: string | string[] }) => {
		const arr: string[] = Array.isArray(value) ? value : [value];
		return arr.map((v: string) => Number(v));
	})
	promptFormatIds?: number[];

	@IsOptional()
	@IsString()
	@IsIn(Object.values(PromptSortBy))
	sortBy?: PromptSortBy = PromptSortBy.DATE_CREATED;

	@IsOptional()
	@IsEnum(SortOrder)
	@IsIn(Object.values(SortOrder))
	sortOrder?: SortOrder = SortOrder.DESC;
}
