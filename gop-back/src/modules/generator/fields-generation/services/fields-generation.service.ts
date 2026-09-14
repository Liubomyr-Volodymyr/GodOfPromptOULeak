import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AIService } from '../../../ai/services/ai.service';
import { PROJECT_KEY } from '../../../../common/enums';
import { NonRetryableError } from '../../../../common/errors/non-retryable.error';
import { FIELDS_GENERATION_INSTRUCTION } from '../instructions/fields.instruction';
import { stripJsonFence } from '../../helpers/strip-json-fence.helper';
import {
	FieldsGenerationJobPayload,
	FieldsGenerationResult,
	isFieldsGenerationResult,
	validateFieldsConstraints,
} from '../dto/fields-generation.dto';

@Injectable()
export class FieldsGenerationService {
	constructor(
		@InjectQueue('fields-generation-queue')
		private readonly queue: Queue,
		private readonly aiService: AIService,
	) {}

	async run(payload: FieldsGenerationJobPayload): Promise<FieldsGenerationResult> {
		const job = await this.queue.add('fields-generation-task', payload, {
			priority: 6,
			attempts: 2,
			backoff: { type: 'fixed', delay: 5000 },
			timeout: 300 * 1000,
		});
		return (await job.finished()) as FieldsGenerationResult;
	}

	async processJob(payload: FieldsGenerationJobPayload): Promise<FieldsGenerationResult> {
		const { input, page_name, sub_category, prompt_format, output_type, prompt_body, variables, trackingId } = payload;

		const userPayload = [
			`output_type: ${output_type}`,
			`Page name: ${page_name}`,
			`Sub-category: ${sub_category}`,
			`Prompt format: ${prompt_format}`,
			`Variables: ${variables.join(', ')}`,
			'',
			'Original user input:',
			input,
			'',
			'Generated prompt-body:',
			prompt_body,
		].join('\n');

		const response: string = await this.aiService.addJobRequest({
			prompt: `${FIELDS_GENERATION_INSTRUCTION.instruction}\n\n${userPayload}`,
			model: FIELDS_GENERATION_INSTRUCTION.model,
			responseFormat: FIELDS_GENERATION_INSTRUCTION.responseFormat,
			project_key: PROJECT_KEY.INTERNAL,
			trackingId,
			fieldName: 'fields-generation',
		});

		let parsed: unknown;
		try {
			parsed = JSON.parse(stripJsonFence(response));
		} catch (err) {
			throw new NonRetryableError(`fields-generation: invalid JSON from AI: ${(err as Error).message}`);
		}

		if (!isFieldsGenerationResult(parsed)) {
			throw new NonRetryableError('fields-generation: AI response missing required keys or has non-string values');
		}

		const constraintErr = validateFieldsConstraints(parsed);
		if (constraintErr) {
			throw new NonRetryableError(`fields-generation: ${constraintErr}`);
		}

		return parsed;
	}
}
