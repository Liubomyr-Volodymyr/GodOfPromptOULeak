import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIModule } from '../ai/ai.module';
import { QdrantModule } from '../qdrant/qdrant.module';
import { PromptsService } from './services/prompts.service';
import { ToolsService } from './services/tools.service';
import { CatalogService } from './services/catalog.service';
import { LibraryService } from './services/library.service';
import { PromptAccessPolicy } from './services/prompt-access.policy';
import { Prompts } from '../library/entities/prompts.entity';
import { InputFormat } from '../library/entities/input-format.entity';
import { PromptMediaService } from './services/prompt-media.service';
import { MinioModule } from '../minio/minio.module';
import { OutputTypes } from '../user-products/entities/output-types.entity';
import { PromptFormat } from '../library/entities/prompt-format.entity';
import { Categories } from '../library/entities/categories.entity';
import { Tool } from '../library/entities/tools.entity';
import { PromptsTools } from '../library/entities/prompts-tools.entity';
import { PromptFormatTools } from '../library/entities/prompt-format-tools.entity';
import { Products } from '../user-products/entities/products.entity';
import { PromptFieldAiInstructions } from '../generator/entities/prompt-field-ai-instructions.entity';
import { PromptFieldAiInstructionsTools } from '../generator/entities/prompt-field-ai-instructions-tools.entity';
import { PromptFieldAiInstructionsPromptFormat } from '../generator/entities/prompt-field-ai-instructions-prompt-format.entity';
import { AudienceType } from '../library/entities/audience-type.entity';
import { PromptsAudienceTypes } from '../library/entities/prompts-audience-types.entity';
import { UserAudienceTypes } from '../library/entities/user-audience-types.entity';
import { PromptLikes } from '../library/entities/prompt-likes.entity';
import { PromptBookmark } from '../library/entities/prompt-bookmarks.entity';
import { PromptComments } from '../library/entities/prompt-comments.entity';
import { DevCatalogController } from './controllers/dev-catalog.controller';
import { LibraryController } from './controllers/library.controller';
import { CommentsController } from './controllers/comments.controller';
import { CommentsService } from './services/comments.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Prompts,
			InputFormat,
			OutputTypes,
			PromptFormat,
			Categories,
			Tool,
			PromptsTools,
			PromptFormatTools,
			Products,
			PromptFieldAiInstructions,
			PromptFieldAiInstructionsTools,
			PromptFieldAiInstructionsPromptFormat,
			AudienceType,
			PromptsAudienceTypes,
			UserAudienceTypes,
			PromptLikes,
			PromptBookmark,
			PromptComments,
		]),
		AIModule,
		MinioModule,
		forwardRef(() => QdrantModule),
	],
	controllers: [DevCatalogController, LibraryController, CommentsController],
	providers: [PromptsService, PromptMediaService, ToolsService, CatalogService, LibraryService, PromptAccessPolicy, CommentsService],
	exports: [PromptsService, PromptMediaService, ToolsService, CatalogService, LibraryService, PromptAccessPolicy],
})
export class PromptsModule {}
