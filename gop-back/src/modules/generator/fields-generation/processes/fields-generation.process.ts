import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { FieldsGenerationService } from '../services/fields-generation.service';
import { FieldsGenerationJobPayload, FieldsGenerationResult } from '../dto/fields-generation.dto';
import { isNonRetryableError } from '../../../../common/errors/non-retryable.error';

@Processor('fields-generation-queue')
export class FieldsGenerationQueueProcessor {
	constructor(private readonly fieldsGenerationService: FieldsGenerationService) {}

	@Process({ name: 'fields-generation-task', concurrency: 2 })
	async processFieldsGeneration(job: Job<FieldsGenerationJobPayload>): Promise<FieldsGenerationResult> {
		console.log(`╭─── Job [Fields Generation] ${job.id}`);
		try {
			const result = await this.fieldsGenerationService.processJob(job.data);
			console.log(`╰─── Job [Fields Generation] ${job.id} completed`);
			return result;
		} catch (error) {
			if (isNonRetryableError(error)) {
				console.error(`╰─── Job [Fields Generation] ${job.id} failed (non-retryable): ${error.message}`);
				await job.discard();
			}
			throw error;
		}
	}
}
