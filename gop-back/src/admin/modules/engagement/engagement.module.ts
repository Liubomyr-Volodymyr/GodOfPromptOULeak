import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './services/engagement.service';
import { PromptLikes } from '../../../modules/library/entities/prompt-likes.entity';
import { PromptBookmark } from '../../../modules/library/entities/prompt-bookmarks.entity';
import { PromptComments } from '../../../modules/library/entities/prompt-comments.entity';
import { Prompts } from '../../../modules/library/entities/prompts.entity';
import { User } from '../../../modules/users/entities/users.entity';

@Module({
	imports: [TypeOrmModule.forFeature([PromptLikes, PromptBookmark, PromptComments, Prompts, User])],
	controllers: [EngagementController],
	providers: [EngagementService],
})
export class EngagementModule {}
