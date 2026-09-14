export class SystemPromptsDto {
	system_prompt_id: number;
	sort: number | null;
	name: string;
	prompt_type: number[];
	plan_type: string;
	model: string;
	insert: string;
	prompt: string;
}
