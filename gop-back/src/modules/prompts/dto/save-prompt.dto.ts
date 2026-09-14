import { InternalAiResult, InternalProcessRequest } from 'src/modules/generator/dto/internal-prompts.dto';

export class SavePromptDto {
	categoryId: number;
	subCategoryId: number;
	inputType: number;
	outputType: {
		id: number;
		name: string;
		tech_name?: string;
		status?: string;
	};
	promptType: number;
	inputData: string;
	screenshotFileId: string;
	aiResult: InternalAiResult;
	dataDto: InternalProcessRequest;
	user_created: string;
	promptCreationType: PromptCreationTypes;
	authorUserId?: string;
	isPromptPublic?: boolean;
	generationCost?: number;
	generationInputTokens?: number;
	generationOutputTokens?: number;
	source?: string;
}

export class ModelIdDto {
	models_id: number;
}

export enum PromptCreationTypes {
	INTERNAL = 'internal',
	CUSTOM = 'custom',
}
