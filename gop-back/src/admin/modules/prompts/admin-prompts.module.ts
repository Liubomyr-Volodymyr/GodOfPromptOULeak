import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptsService } from './services/prompts.service';
import { AdminPromptsService } from './services/admin-prompts.service';
import { PromptsCatalogService } from './services/prompts-catalog.service';
import { PromptsController } from './prompts.controller';
import { AIModule } from '../../../modules/ai/ai.module';
import { Prompts } from '../../../modules/library/entities/prompts.entity';
import { User } from '../../../modules/users/entities/users.entity';
import { BulkInternalModule } from '../../../modules/generator/bulk/bulk-internal.module';
import { PromptsModule } from '../../../modules/prompts/prompts.module';

@Module({
	controllers: [PromptsController],
	providers: [PromptsService, AdminPromptsService, PromptsCatalogService],
	imports: [TypeOrmModule.forFeature([Prompts, User]), AIModule, BulkInternalModule, PromptsModule],
})
export class AdminPromptsModule {}
