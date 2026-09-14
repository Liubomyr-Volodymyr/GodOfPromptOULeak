import { IsNumberString, IsOptional, IsString } from 'class-validator';
import { SortOrder } from '../../../common/enums';

export class PaginationQueryDto {
	@IsNumberString()
	page: number;

	@IsNumberString()
	limit: number;

	@IsOptional()
	@IsString()
	sortOrder?: SortOrder;
}
