import { IsOptional, IsString, IsInt, Min, IsIn, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { SortOrder } from '../../../../common/enums';

export enum UserSortBy {
	FIRST_NAME = 'first_name',
	LAST_NAME = 'last_name',
	DATE_CREATED = 'date_created',
}

export const USER_SORT_COLUMN: Record<UserSortBy, string> = {
	[UserSortBy.FIRST_NAME]: 'user.firstName',
	[UserSortBy.LAST_NAME]: 'user.lastName',
	[UserSortBy.DATE_CREATED]: 'user.createdAt',
};

export const PRODUCT_PRICE_NAMES = [
	'gop-premium-monthly',
	'gop-image-pro-annual',
	'gop-image-pro-monthly',
	'gop-text-pro-annual',
	'gop-n8n-automations-bundle-lifetime',
	'gop-premium-annual',
	'gop-image-pro-lifetime',
	'gop-text-pro-lifetime',
	'gop-ai-tools-directory-lifetime',
	'gop-text-pro-monthly',
	'gop-custom-prompt',
	'gop-chatgpt-custom-instructions-lifetime',
	'gop-premium-lifetime',
	'gop-custom-gpts-toolkit-lifetime',
];

export class FindAllMembersDto {
	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsString()
	@IsIn(PRODUCT_PRICE_NAMES)
	product?: string;

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
	@IsString()
	@IsIn(['first_name', 'last_name', 'date_created'])
	sortBy?: UserSortBy = UserSortBy.DATE_CREATED;

	@IsOptional()
	@IsEnum(SortOrder)
	@IsIn(Object.values(SortOrder))
	sortOrder?: SortOrder.ASC | SortOrder.DESC = SortOrder.DESC;

	@IsOptional()
	@IsString()
	dateFrom?: string;

	@IsOptional()
	@IsString()
	dateTo?: string;
}
