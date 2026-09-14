import { Injectable, OnModuleInit } from '@nestjs/common';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { AIRequestDto } from '../dto/ai.dto';
import { AssistantService } from './assistant.service';
import { UsageTrackingService } from './usage-tracking.service';
import { ModelPricingService } from './model-pricing.service';
import { OpenRouterService } from './openrouter.service';
import { ChatResponse, GeminiChatApi } from '../clients/gemini-chat.api';

const FALLBACK_MODEL: string = 'openai/gpt-4o';

@Injectable()
export class AIService implements OnModuleInit {
	constructor(
		@InjectQueue('claude-requests-queue')
		private readonly claudeRequestsQueue: Queue,
		@InjectQueue('openai-requests-queue')
		private readonly openaiRequestsQueue: Queue,
		@InjectQueue('openrouter-requests-queue')
		private readonly openrouterRequestsQueue: Queue,
		private readonly assistantService: AssistantService,
		private readonly usageTracking: UsageTrackingService,
		private readonly modelPricing: ModelPricingService,
		private readonly openRouterService: OpenRouterService,
	) {}

	onModuleInit() {
		this.claudeRequestsQueue.setMaxListeners(50);
		this.openaiRequestsQueue.setMaxListeners(50);
		this.openrouterRequestsQueue.setMaxListeners(50);
	}

	async addJobRequest(dataDto: AIRequestDto): Promise<string> {
		const priority = dataDto.priority || 5;
		const queue = this.getQueueForModel(dataDto.model);
		const jobName = this.getJobNameForModel(dataDto.model);
		const model = dataDto.model ?? 'Not Set';
		const isOpenRouter: boolean = typeof dataDto.model === 'string' && dataDto.model.includes('/');
		const attempts: number = isOpenRouter ? 3 : 2;

		const job = await queue.add(jobName, dataDto, {
			priority,
			attempts,
			backoff: { type: 'exponential', delay: 500 },
			timeout: 180 * 1000,
		});

		try {
			return await job.finished();
		} catch (error) {
			console.error('Error in AI request job processing:', error);
			throw new Error('AI request job processing failed: ' + error.message);
		}
	}

	async aiRequest(data: AIRequestDto): Promise<string> {
		try {
			return await this.executeModelRequest(data);
		} catch (primaryError: any) {
			if (data.model === FALLBACK_MODEL) {
				console.error('AI request failed (already on fallback):', primaryError);
				throw new Error(`AI request failed with error: ${primaryError.message}`);
			}

			console.warn(`[AIService] Primary model "${data.model}" failed (${primaryError.message}), falling back to ${FALLBACK_MODEL}`);

			try {
				return await this.executeModelRequest({ ...data, model: FALLBACK_MODEL });
			} catch (fallbackError: any) {
				console.error('AI request failed on fallback:', fallbackError);
				throw new Error(`AI request failed with error: ${fallbackError.message}`);
			}
		}
	}

	private async executeModelRequest(data: AIRequestDto): Promise<string> {
		const { model, prompt, project_key, trackingId, fieldName, responseFormat } = data;
		const promptStr: string = JSON.stringify(prompt);

		let content: string;
		let inputTokens: number = 0;
		let outputTokens: number = 0;
		let hasRealUsage: boolean = false;
		let trackUsageHere: boolean = true;

		if (model.startsWith('asst')) {
			const response = await this.assistantService.getAssistantResponse({
				assistantId: model,
				prompt: promptStr,
				project_key,
				responseFormat,
			});
			content = response.content;
		} else if (model.includes('/')) {
			content = await this.openRouterService.makeRequest(model, promptStr, trackingId, fieldName, responseFormat);
			trackUsageHere = false;
		} else if (model.startsWith('claude-')) {
			const anthropic: Anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
			const message: Anthropic.Message = await anthropic.messages.create({
				model,
				max_tokens: 4096,
				temperature: 0,
				messages: [{ role: 'user', content: promptStr }],
			});

			content = message.content[0].type === 'text' ? message.content[0].text : '';
			inputTokens = message.usage.input_tokens;
			outputTokens = message.usage.output_tokens;
			hasRealUsage = true;
		} else {
			let response: ChatResponse;

			if (model.startsWith('gpt-')) {
				const openai = new OpenAI({ apiKey: process.env.OPENAI_CUSTOM_API_KEY });
				const completion = await openai.chat.completions.create({
					model,
					messages: [{ role: 'user', content: promptStr }],
					...(responseFormat ? { response_format: { type: responseFormat } } : {}),
				});

				response = {
					content: completion.choices[0].message.content ?? '',
					usage: completion.usage
						? {
								promptTokens: completion.usage.prompt_tokens,
								completionTokens: completion.usage.completion_tokens,
								totalTokens: completion.usage.total_tokens,
							}
						: undefined,
				};
			} else if (model.startsWith('gemini-')) {
				const ai = new GeminiChatApi({ apiKey: process.env.GEMINI_API_KEY }, { model });
				response = await ai.textCompletion(promptStr);
			} else {
				throw new Error(`Unsupported model: ${model}`);
			}

			content = response.content;

			if (response.usage) {
				inputTokens = response.usage.promptTokens;
				outputTokens = response.usage.completionTokens;
				hasRealUsage = true;
			}
		}

		if (trackUsageHere && trackingId && (hasRealUsage || content)) {
			try {
				if (!hasRealUsage) {
					inputTokens = Math.ceil(promptStr.length / 4);
					outputTokens = Math.ceil((content?.length ?? 0) / 4);
				}

				const cost: number = this.modelPricing.calculateCost(model, inputTokens, outputTokens);

				await this.usageTracking.logFieldUsage(trackingId, {
					field: fieldName ?? 'unknown',
					model,
					inputTokens,
					outputTokens,
					cost,
				});
			} catch (trackingError: any) {
				console.error(`Usage tracking failed (non-blocking): ${trackingError?.message}`);
			}
		}

		return content;
	}

	private getQueueForModel(model: string): Queue {
		// OpenRouter models contain "/" (e.g., "openai/gpt-4o", "anthropic/claude-3.5-sonnet")
		if (model.includes('/')) {
			return this.openrouterRequestsQueue;
		}

		// Legacy models
		if (model.startsWith('asst') || model.includes('gpt')) {
			return this.openaiRequestsQueue;
		} else {
			return this.claudeRequestsQueue;
		}
	}

	private getJobNameForModel(model: string): string {
		// OpenRouter models contain "/" (e.g., "openai/gpt-4o", "anthropic/claude-3.5-sonnet")
		if (model.includes('/')) {
			return 'openrouter-request-task';
		}

		// Legacy models
		if (model.startsWith('asst') || model.includes('gpt')) {
			return 'openai-request-task';
		} else {
			return 'claude-request-task';
		}
	}
}
