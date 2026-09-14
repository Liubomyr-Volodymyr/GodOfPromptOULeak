import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AIService } from '../../../ai/services/ai.service';
import { PROJECT_KEY } from '../../../../common/enums';
import { NonRetryableError } from '../../../../common/errors/non-retryable.error';
import { InputType } from '../../dto/internal-prompts.dto';
import {
	PromptsGenerationJobPayload,
	PromptsGenerationResult,
	isPromptsGenerationAiResponse,
	extractVariableTokens,
} from '../dto/prompts-generation.dto';
import { PROMPT_BODY_GENERATE_INSTRUCTION, PROMPT_BODY_OPTIMIZE_INSTRUCTION, PROMPT_BODY_FORMAT_INSTRUCTION } from '../instructions';
import { stripJsonFence } from '../../helpers/strip-json-fence.helper';

const CONFIG_BY_INPUT_TYPE: Record<InputType, { instruction: string; model: string; responseFormat: 'json_object' | 'text' }> = {
	[InputType.TASK]: PROMPT_BODY_GENERATE_INSTRUCTION,
	[InputType.PRE_PROMPT]: PROMPT_BODY_OPTIMIZE_INSTRUCTION,
	[InputType.READY_PROMPT]: PROMPT_BODY_FORMAT_INSTRUCTION,
};

@Injectable()
export class PromptsGenerationService {
	constructor(
		@InjectQueue('prompts-generation-queue')
		private readonly queue: Queue,
		private readonly aiService: AIService,
	) {}

	async run(payload: PromptsGenerationJobPayload): Promise<PromptsGenerationResult> {
		const job = await this.queue.add('prompts-generation-task', payload, {
			priority: 6,
			attempts: 2,
			backoff: { type: 'fixed', delay: 5000 },
			timeout: 300 * 1000,
		});
		return (await job.finished()) as PromptsGenerationResult;
	}

	async processJob(payload: PromptsGenerationJobPayload): Promise<PromptsGenerationResult> {
		const { input, input_type, output_type, trackingId } = payload;

		const config = CONFIG_BY_INPUT_TYPE[input_type];
		if (!config) {
			throw new NonRetryableError(`Unknown input_type: ${input_type}`);
		}

		const userPayload = [`output_type: ${output_type}`, '', 'User input:', input].join('\n');

		const raw: string = await this.aiService.addJobRequest({
			prompt: `${config.instruction}\n\n${userPayload}`,
			model: config.model,
			responseFormat: config.responseFormat,
			project_key: PROJECT_KEY.INTERNAL,
			trackingId,
			fieldName: 'prompt-body',
		});

		let parsed: unknown;
		try {
			parsed = JSON.parse(stripJsonFence(raw));
		} catch (err) {
			throw new NonRetryableError(`prompts-generation: invalid JSON from AI: ${(err as Error).message}`);
		}

		if (!isPromptsGenerationAiResponse(parsed)) {
			throw new NonRetryableError('prompts-generation: AI response missing or invalid "prompt_body"');
		}

		const variables: string[] = extractVariableTokens(parsed.prompt_body);
		if (variables.length === 0) {
			throw new NonRetryableError('prompts-generation: prompt-body must contain at least one {{variable}}');
		}

		// Variable budget backstop (mirrors the HARD CAP in the format/generate/optimize instructions).
		// Non-fatal: surface an over-budget draft as a warning so it can be caught in review, without failing the job.
		const budget: number = ['image', 'all'].includes(output_type) ? 3 : 5;
		if (variables.length > budget) {
			const warning = `variable budget exceeded: ${variables.length} {{variables}} for output_type "${output_type}" (cap ${budget}) - consider consolidating: ${variables.join(', ')}`;
			console.warn(`├─── prompts-generation: ${warning}`);
			const warnings: string[] = Array.isArray(parsed.warnings) ? [...parsed.warnings, warning] : [warning];
			return { ...parsed, warnings, variables };
		}

		return { ...parsed, variables };
	}
}
