import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { FormatProcessRequest, InternalAiResult, InternalProcessRequest } from '../../dto/internal-prompts.dto';

@Injectable()
export class BulkInternalService {
	constructor(
		@InjectQueue('internal-bulk-queue')
		private readonly queue: Queue,
	) {}

	run(items: InternalProcessRequest[]): Promise<InternalAiResult[]> {
		return this.enqueueAndCollect('internal-bulk-task', items);
	}

	format(items: FormatProcessRequest[]): Promise<InternalAiResult[]> {
		return this.enqueueAndCollect('internal-format-task', items);
	}

	private async enqueueAndCollect<T>(jobName: string, items: T[]): Promise<InternalAiResult[]> {
		const jobs: Job<T>[] = await Promise.all(
			items.map(
				(item: T): Promise<Job<T>> =>
					this.queue.add(jobName, item, {
						priority: 6,
						attempts: 2,
						backoff: { type: 'fixed', delay: 5000 },
						timeout: 300 * 1000,
					}),
			),
		);

		const settled: PromiseSettledResult<InternalAiResult>[] = await Promise.allSettled(
			jobs.map((job: Job<T>): Promise<InternalAiResult> => job.finished() as Promise<InternalAiResult>),
		);

		const results: InternalAiResult[] = [];
		settled.forEach((outcome: PromiseSettledResult<InternalAiResult>, index: number): void => {
			if (outcome.status === 'fulfilled') {
				results.push(outcome.value);
			} else {
				console.error(`├─ Bulk item ${index} failed (skipped): ${(outcome.reason as Error).message}`);
			}
		});

		return results;
	}
}
