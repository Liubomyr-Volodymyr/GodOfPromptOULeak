import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { CONFIG } from '../../../config/enums';
import { UsageTrackingService } from './usage-tracking.service';
import { ModelPricingService } from './model-pricing.service';

@Injectable()
export class OpenRouterService {
	private readonly client: OpenAI;

	constructor(
		private readonly configService: ConfigService,
		private readonly usageTracking: UsageTrackingService,
		private readonly modelPricing: ModelPricingService,
	) {
		const apiKey: string | undefined = this.configService.get<string>(CONFIG.OPENROUTER_API_KEY);

		if (!apiKey) {
			throw new Error('OPENROUTER_API_KEY is not configured');
		}

		this.client = new OpenAI({
			apiKey,
			baseURL: 'https://openrouter.ai/api/v1',
		});
	}

	async makeRequest(
		model: string,
		prompt: string,
		trackingId?: string,
		fieldName?: string,
		responseFormat?: 'json_object' | 'text',
	): Promise<string> {
		try {
			const completion = await this.client.chat.completions.create({
				model,
				messages: [
					{
						role: 'user',
						content: prompt,
					},
				],
				...(responseFormat ? { response_format: { type: responseFormat } } : {}),
			});

			const content: string | null = completion.choices[0]?.message?.content;

			if (!content) {
				throw new Error('No content in OpenRouter response');
			}

			if (trackingId && completion.usage) {
				const inputTokens: number = completion.usage.prompt_tokens ?? 0;
				const outputTokens: number = completion.usage.completion_tokens ?? 0;
				const cost: number = this.modelPricing.calculateCost(model, inputTokens, outputTokens);

				await this.usageTracking.logFieldUsage(trackingId, {
					field: fieldName ?? 'unknown',
					model,
					inputTokens,
					outputTokens,
					cost,
				});
			}

			return content;
		} catch (error: any) {
			console.error('OpenRouter request failed:', error);
			throw new Error(`OpenRouter request failed: ${error.message}`);
		}
	}
}
