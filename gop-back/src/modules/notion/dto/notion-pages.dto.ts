import { InternalAiResult } from '../../generator/dto/internal-prompts.dto';

export interface NotionBlockDto {
	type:
		| 'paragraph'
		| 'heading_1'
		| 'heading_2'
		| 'heading_3'
		| 'quote'
		| 'bulleted_list_item'
		| 'numbered_list_item'
		| 'to_do'
		| 'toggle'
		| 'code'
		| 'image'
		| 'bookmark';
	content: string;
	url?: string;
	language?: string;
}

export class AddToLibraryDto {
	parent_id: string;
	screenshot: string;
	sub_category: string;
	ai_result: InternalAiResult;
	modelNames: string[];
}
