import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AIModule } from '../../ai/ai.module';
import { PromptsGenerationService } from './services/prompts-generation.service';
import { PromptsGenerationQueueProcessor } from './processes/prompts-generation.process';

@Module({
	imports: [BullModule.registerQueue({ name: 'prompts-generation-queue' }), AIModule],
	providers: [PromptsGenerationService, PromptsGenerationQueueProcessor],
	exports: [PromptsGenerationService],
})
export class PromptsGenerationModule {}
