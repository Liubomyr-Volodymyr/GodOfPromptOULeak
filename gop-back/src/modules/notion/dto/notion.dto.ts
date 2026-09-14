import { IsOptional } from 'class-validator';
import type { QueryDatabaseParameters } from '@notionhq/client/build/src/api-endpoints';

export class NotionTaskCreateDto {
	name: string;
	spend: number;
	email: string;
	task: string;
	time: number;
}

export class UpdateData {
	name?: string;
	generate?: boolean;
	pdf?: boolean;
	csv?: boolean;
	upload?: boolean;
	mail?: boolean;
	done?: boolean;
	time?: number;
	prompt?: string;
	order?: number;
	category?: string;
	sub_category?: string;
	premium?: boolean;
	new?: boolean;
	files?: string | string[];
	[key: string]: any;
}

export class GetDbOptionsDto {
	@IsOptional()
	sorts?: QueryDatabaseParameters['sorts'];

	@IsOptional()
	filter?: QueryDatabaseParameters['filter'];
}

export class NotionRowsDto {
	page_id?: string;
	order?: number;
	name?: string;
	model?: string;
	prompt?: string;
	insert?: string;
	category?: string;
	sub_category?: string;
	premium?: boolean;
	done?: boolean;
}
