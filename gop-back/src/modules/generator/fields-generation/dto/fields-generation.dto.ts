import { OutputType } from '../../dto/internal-prompts.dto';
import { Tool } from '../../../library/entities/tools.entity';

export interface FieldsGenerationJobPayload {
	input: string;
	page_name: string;
	sub_category: string;
	prompt_format: string;
	output_type: OutputType;
	prompt_body: string;
	variables: string[];
	trackingId: string;
}

export interface FieldsGenerationResult {
	description: string;
	'seo-description': string;
	'how-to-use': string;
	tips: string;
	'what-prompt-does': string;
	'prompt-name': string;
	icon: string;
	'example-input': string;
	'example-output': string;
	html: string;
}

export type FieldsBranchResult = FieldsGenerationResult & { tools: Tool[] };

export const FIELDS_CONSTRAINTS = {
	'seo-description': { maxLength: 1600 }, // long-form GEO on-page "about" copy (was a 160-char meta stub)
	'prompt-name': { maxLength: 60 },
} as const;

const REQUIRED_KEYS: (keyof FieldsGenerationResult)[] = [
	'description',
	'seo-description',
	'how-to-use',
	'tips',
	'what-prompt-does',
	'prompt-name',
	'icon',
	'example-input',
	'example-output',
	'html',
];

export function isFieldsGenerationResult(value: unknown): value is FieldsGenerationResult {
	if (!value || typeof value !== 'object') return false;
	const v = value as Record<string, unknown>;
	for (const k of REQUIRED_KEYS) {
		if (typeof v[k] !== 'string' || (v[k] as string).length === 0) return false;
	}
	return true;
}

export function validateFieldsConstraints(result: FieldsGenerationResult): string | null {
	if (result['seo-description'].length > FIELDS_CONSTRAINTS['seo-description'].maxLength) {
		return `seo-description exceeds ${FIELDS_CONSTRAINTS['seo-description'].maxLength} chars`;
	}
	if (result['prompt-name'].length > FIELDS_CONSTRAINTS['prompt-name'].maxLength) {
		return `prompt-name exceeds ${FIELDS_CONSTRAINTS['prompt-name'].maxLength} chars`;
	}
	return null;
}
