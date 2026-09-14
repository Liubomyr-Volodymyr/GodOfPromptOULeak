import { PaginationItems } from '../../../common/dto/pagination.dto';

export class MemberPromptInteractionDto {
	id: string;
	prompt_id: string | null;
	prompt_name: string | null;
	slug: string | null;
	created_at: Date;
}

export class MemberPromptInteractionsPageDto extends PaginationItems<MemberPromptInteractionDto> {
	items: MemberPromptInteractionDto[];
}
