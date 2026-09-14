import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QdrantClientService } from './services/qdrant-client.service';
import { QdrantController } from './controllers/qdrant.controller';
import { QdrantService } from './services/qdrant.service';
import { EmbeddingsService } from './services/embedding.service';
import { QdrantCronService } from './services/qdrant-cron.service';
import { PromptsModule } from '../prompts/prompts.module';
import { QdrantSyncService } from './services/qdrant-sync.service';
import { Prompts } from '../library/entities/prompts.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Prompts]), forwardRef(() => PromptsModule)],
	controllers: [QdrantController],
	providers: [QdrantClientService, QdrantSyncService, QdrantService, EmbeddingsService, QdrantCronService],
	exports: [QdrantService, EmbeddingsService],
})
export class QdrantModule {}
