export class InputTypeDto {
	id: number;
	sort: number | null;
	name: string;
	tech_name: string;
}

export enum InputTypesEnum {
	DEFAULT = 1,
	READY_PROMPT = 2,
}
