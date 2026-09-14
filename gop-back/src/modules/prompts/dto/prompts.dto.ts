export class PromptCategoryDto {
	id: number;
	name: string;
	slug: string;
}

export class PromptsDto {
	id: string;
	page_name: string;
	slug: string;
	premium: boolean;
	category: PromptCategoryDto;
	sub_category: PromptCategoryDto;
	output_type: string | null;
}
