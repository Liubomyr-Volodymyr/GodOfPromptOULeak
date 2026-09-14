import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';
import { SortOrder } from '../../../../common/enums';
import { PaginationItems } from '../../../common/dto/pagination.dto';

export enum EngagementType {
	Like = 'like',
	Bookmark = 'bookmark',
	Comment = 'comment',
}

export class FindFeedDto {
	@IsOptional()
	@IsNumberString()
	page?: string;

	@IsOptional()
	@IsNumberString()
	limit?: string;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsUUID()
	promptId?: string;

	@IsOptional()
	@IsString()
	sortOrder?: SortOrder;
}

export class EngagementFeedItemDto {
	id: string;
	type: EngagementType;
	user_id: string | null;
	user_name: string | null;
	user_email: string | null;
	prompt_id: string | null;
	prompt_name: string | null;
	slug: string | null;
	text: string | null;
	created_at: Date;
}

export class EngagementFeedPageDto extends PaginationItems<EngagementFeedItemDto> {
	items: EngagementFeedItemDto[];
}
