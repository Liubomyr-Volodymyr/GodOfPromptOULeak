import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { IModelPricing, IOpenRouterModel, IOpenRouterResponse } from '../interfaces/model-pricing.interfaces';

@Injectable()
export class ModelPricingService implements OnModuleInit {
	private readonly logger = new Logger(ModelPricingService.name);
	private readonly priceMap = new Map<string, IModelPricing>();
	private readonly OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

	async onModuleInit(): Promise<void> {
		await this.fetchPrices();
	}

	@Cron('0 0 * * 1')
	async handleCron(): Promise<void> {
		this.logger.log('[Cron] Weekly model pricing update started');
		await this.fetchPrices();
	}

	getModelPrice(techName: string): IModelPricing | null {
		const direct: IModelPricing | undefined = this.priceMap.get(techName);
		if (direct) return direct;

		for (const [key, value] of this.priceMap.entries()) {
			if (key.endsWith(`/${techName}`)) return value;
		}

		const normalized: string = techName.replace(/-(\d+)$/, '.$1');
		if (normalized !== techName) {
			for (const [key, value] of this.priceMap.entries()) {
				if (key.endsWith(`/${normalized}`)) return value;
			}
		}

		return null;
	}

	calculateCost(model: string, inputTokens: number, outputTokens: number): number {
		const price: IModelPricing | null = this.getModelPrice(model);
		if (!price) return 0;

		return inputTokens * price.input + outputTokens * price.output;
	}

	estimatePromptCost(textFields: string[], modelTechName: string): number {
		const totalChars: number = textFields.reduce((sum, text) => sum + (text?.length ?? 0), 0);
		const estimatedOutputTokens: number = Math.ceil(totalChars / 4);

		const price: IModelPricing | null = this.getModelPrice(modelTechName);
		if (!price) return 0;

		return estimatedOutputTokens * price.output;
	}

	private async fetchPrices(): Promise<void> {
		try {
			const response = await axios.get<IOpenRouterResponse>(this.OPENROUTER_MODELS_URL);
			const models: IOpenRouterModel[] = response.data?.data ?? [];

			this.priceMap.clear();

			for (const model of models) {
				if (!model.pricing?.prompt || !model.pricing?.completion) continue;

				const input: number = parseFloat(model.pricing.prompt);
				const output: number = parseFloat(model.pricing.completion);

				if (isNaN(input) || isNaN(output)) continue;

				this.priceMap.set(model.id, { input, output });
			}

			this.logger.log(`Model pricing updated: ${this.priceMap.size} models cached`);
		} catch (error: any) {
			this.logger.error(`Failed to fetch model pricing: ${error?.message ?? error}`);
		}
	}
}
