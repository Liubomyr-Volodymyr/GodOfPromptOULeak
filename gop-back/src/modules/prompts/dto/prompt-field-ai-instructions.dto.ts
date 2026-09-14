export class PromptFieldAiInstructionDto {
	id: number;
	promptFormatId: number;
	fieldName: string;
	instruction: string;
	instructionPremium?: string | null;

	tool?: {
		id: number;
		slug: string;
		name: string;
	} | null;
}
