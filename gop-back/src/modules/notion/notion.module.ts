import { Module } from '@nestjs/common';
import { NotionService } from './services/notion.service';
import { NotionClientService } from './services/notion-client.service';
import { NotionPagesService } from './services/notion-pages.service';
import { NotionController } from './controllers/notion.controller';

@Module({
	controllers: [NotionController],
	providers: [NotionClientService, NotionService, NotionPagesService],
	imports: [],
	exports: [NotionService, NotionPagesService],
})
export class NotionModule {}
