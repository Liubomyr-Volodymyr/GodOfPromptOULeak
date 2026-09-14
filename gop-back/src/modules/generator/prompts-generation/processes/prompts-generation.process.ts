import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PromptsGenerationService } from '../services/prompts-generation.service';
import { PromptsGenerationJobPayload, PromptsGenerationResult } from '../dto/prompts-generation.dto';
import { isNonRetryableError } from '../../../../common/errors/non-retryable.error';

@Processor('prompts-generation-queue')
export class PromptsGenerationQueueProcessor {
	constructor(private readonly promptsGenerationService: PromptsGenerationService) {}

	@Process({ name: 'prompts-generation-task', concurrency: 2 })
	async processPromptsGeneration(job: Job<PromptsGenerationJobPayload>): Promise<PromptsGenerationResult> {
		console.log(`╭─── Job [Prompts Generation] ${job.id} (input_type=${job.data.input_type})`);
		try {
			const result = await this.promptsGenerationService.processJob(job.data);
			console.log(`╰─── Job [Prompts Generation] ${job.id} completed`);
			return result;
		} catch (error) {
			if (isNonRetryableError(error)) {
				console.error(`╰─── Job [Prompts Generation] ${job.id} failed (non-retryable): ${error.message}`);
				await job.discard();
			}
			throw error;
		}
	}
}
