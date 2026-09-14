import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AIService } from '../services/ai.service';
import { OpenRouterService } from '../services/openrouter.service';

class BaseQueueProcessor {
	constructor(protected aiService: AIService) {}

	protected async processRequest(job: Job): Promise<string> {
		return await this.aiService.aiRequest(job.data);
	}
}

@Processor('claude-requests-queue')
export class ClaudeQueueProcessor extends BaseQueueProcessor {
	constructor(aiService: AIService) {
		super(aiService);
	}

	@Process({ name: 'claude-request-task', concurrency: 10 })
	async processClaudeRequest(job: Job): Promise<string> {
		return this.processRequest(job);
	}
}

@Processor('openai-requests-queue')
export class OpenAIQueueProcessor extends BaseQueueProcessor {
	constructor(aiService: AIService) {
		super(aiService);
	}

	@Process({ name: 'openai-request-task', concurrency: 10 })
	async processOpenAIRequest(job: Job): Promise<string> {
		return this.processRequest(job);
	}
}

@Processor('openrouter-requests-queue')
export class OpenRouterQueueProcessor {
	constructor(private readonly openRouterService: OpenRouterService) {}

	@Process({ name: 'openrouter-request-task', concurrency: 10 })
	async processOpenRouterRequest(job: Job): Promise<string> {
		const { model, prompt, trackingId, fieldName } = job.data;
		return await this.openRouterService.makeRequest(model, prompt, trackingId, fieldName);
	}
}
