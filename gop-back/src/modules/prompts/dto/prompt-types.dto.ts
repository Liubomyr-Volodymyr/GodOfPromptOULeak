export class PromptTypeDto {
	id: number;
	name: string;
	tech_name: string;
	tools?: { models_id: number; slug: string }[];
}

export enum PromptTypes {
	DEFAULT = 1,
	INTERACTIVE = 2,
	IMAGE = 3,
	XML = 4,
}
