import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { GeneratorModule } from '../generator.module';
import { BulkInternalService } from './services/bulk-internal.service';
import { BulkInternalQueueProcessor } from './processes/bulk-internal.process';
import { BulkGeneratorController } from './controllers/bulk-generator.controller';

@Module({
	imports: [BullModule.registerQueue({ name: 'internal-bulk-queue' }), GeneratorModule],
	controllers: [BulkGeneratorController],
	providers: [BulkInternalService, BulkInternalQueueProcessor],
	exports: [BulkInternalService],
})
export class BulkInternalModule {}
