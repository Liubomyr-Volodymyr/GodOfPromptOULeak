import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AIModule } from '../../ai/ai.module';
import { FieldsGenerationService } from './services/fields-generation.service';
import { FieldsGenerationQueueProcessor } from './processes/fields-generation.process';

@Module({
	imports: [BullModule.registerQueue({ name: 'fields-generation-queue' }), AIModule],
	providers: [FieldsGenerationService, FieldsGenerationQueueProcessor],
	exports: [FieldsGenerationService],
})
export class FieldsGenerationModule {}
