import { Module } from '@nestjs/common';
import { AIService } from './services/ai.service';
import { BullModule } from '@nestjs/bull';
import { ClaudeQueueProcessor, OpenAIQueueProcessor, OpenRouterQueueProcessor } from './processes/ai.process';
import { AssistantService } from './services/assistant.service';
import { OpenRouterService } from './services/openrouter.service';
import { UsageTrackingService } from './services/usage-tracking.service';
import { ModelPricingService } from './services/model-pricing.service';
import { MlflowModule } from '../mlflow/mlflow.module';

@Module({
	controllers: [],
	providers: [
		AIService,
		AssistantService,
		OpenRouterService,
		UsageTrackingService,
		ModelPricingService,
		ClaudeQueueProcessor,
		OpenAIQueueProcessor,
		OpenRouterQueueProcessor,
	],
	imports: [
		BullModule.registerQueue(
			{
				name: 'claude-requests-queue',
				settings: { stalledInterval: 120000, maxStalledCount: 2 },
			},
			{
				name: 'openai-requests-queue',
				settings: { stalledInterval: 120000, maxStalledCount: 2 },
			},
			{ name: 'openrouter-requests-queue' },
		),
		MlflowModule,
	],
	exports: [AIService, AssistantService, UsageTrackingService, ModelPricingService],
})
export class AIModule {}
