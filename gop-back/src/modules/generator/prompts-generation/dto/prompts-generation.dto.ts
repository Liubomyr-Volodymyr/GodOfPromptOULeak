import { InputType, OutputType } from '../../dto/internal-prompts.dto';

export interface PromptsGenerationJobPayload {
	input: string;
	input_type: InputType;
	output_type: OutputType;
	trackingId: string;
}

export interface IPromptsGenerationAiResponse {
	prompt_body: string;
	warnings?: string[];
}

export interface PromptsGenerationResult extends IPromptsGenerationAiResponse {
	variables: string[];
}

export function isPromptsGenerationAiResponse(value: unknown): value is IPromptsGenerationAiResponse {
	if (!value || typeof value !== 'object') return false;
	const response = value as Record<string, unknown>;

	if (typeof response.prompt_body !== 'string' || response.prompt_body.length === 0) return false;
	if (response.warnings !== undefined) {
		if (!Array.isArray(response.warnings)) return false;
		if (!response.warnings.every((warning: unknown): boolean => typeof warning === 'string')) return false;
	}

	return true;
}

export function extractVariableTokens(promptBody: string): string[] {
	const tokens = new Set<string>();
	const variablePattern = /\{\{\s*([a-z0-9][a-z0-9_-]*)\s*\}\}/gi;
	let match: RegExpExecArray | null;
	while ((match = variablePattern.exec(promptBody)) !== null) {
		tokens.add(match[1].toLowerCase());
	}
	return [...tokens];
}

export function variablesAreConsistent(result: PromptsGenerationResult): boolean {
	const declared = new Set<string>(result.variables.map((variable: string): string => variable.toLowerCase()));
	const found = new Set<string>(extractVariableTokens(result.prompt_body));

	if (declared.size !== found.size) return false;
	for (const variable of declared) if (!found.has(variable)) return false;
	return true;
}
