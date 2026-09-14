import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InternalGeneratorService } from '../../services/internal-generator.service';
import { FormatProcessRequest, InternalAiResult, InternalProcessRequest } from '../../dto/internal-prompts.dto';
import { isNonRetryableError } from '../../../../common/errors/non-retryable.error';

@Processor('internal-bulk-queue')
export class BulkInternalQueueProcessor {
	constructor(private readonly internalGeneratorService: InternalGeneratorService) {}

	@Process({ name: 'internal-bulk-task', concurrency: 2 })
	async processBulkInternal(job: Job<InternalProcessRequest>): Promise<InternalAiResult> {
		console.log(`╭─── Job [Bulk Internal] ${job.id} (author=${job.data.author})`);
		try {
			const result: InternalAiResult = await this.internalGeneratorService.processInternal(job.data);
			console.log(`╰─── Job [Bulk Internal] ${job.id} completed`);
			return result;
		} catch (error) {
			if (isNonRetryableError(error)) {
				console.error(`╰─── Job [Bulk Internal] ${job.id} failed (non-retryable): ${(error as Error).message}`);
				await job.discard();
			}
			throw error;
		}
	}

	@Process({ name: 'internal-format-task', concurrency: 2 })
	async processBulkFormat(job: Job<FormatProcessRequest>): Promise<InternalAiResult> {
		console.log(`╭─── Job [Bulk Format] ${job.id} (prompt_id=${job.data.prompt_id ?? 'new'})`);
		try {
			const result: InternalAiResult = await this.internalGeneratorService.processFormat(job.data);
			console.log(`╰─── Job [Bulk Format] ${job.id} completed`);
			return result;
		} catch (error) {
			if (isNonRetryableError(error)) {
				console.error(`╰─── Job [Bulk Format] ${job.id} failed (non-retryable): ${(error as Error).message}`);
				await job.discard();
			}
			throw error;
		}
	}
}
