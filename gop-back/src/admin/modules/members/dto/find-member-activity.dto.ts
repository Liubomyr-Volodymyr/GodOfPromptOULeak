import { IsNumberString, IsOptional, IsString } from 'class-validator';
import { SortOrder } from '../../../../common/enums';

export class FindMemberActivityDto {
	@IsNumberString()
	page: number;

	@IsNumberString()
	limit: number;

	@IsOptional()
	@IsString()
	dateFrom?: string;

	@IsOptional()
	@IsString()
	dateTo?: string;

	@IsOptional()
	@IsString()
	type?: string;

	@IsOptional()
	@IsString()
	method?: string;

	@IsOptional()
	@IsString()
	sortOrder?: SortOrder;
}
