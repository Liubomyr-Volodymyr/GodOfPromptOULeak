import { Body, Controller, Patch, Delete, UseGuards, Param } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiKeyGuard } from '../../../common/guards/api-key.guard';
import { ApiTags } from '@nestjs/swagger';
import { UpdateLibraryDto } from '../dto/notion-library.dto';
import { NotionPagesService } from '../services/notion-pages.service';

@SkipThrottle()
@ApiTags('Notion')
@Controller('notion')
export class NotionController {
	constructor(private readonly notionPagesService: NotionPagesService) {}

	@Patch('update-library')
	@UseGuards(ApiKeyGuard)
	async updateLibrary(@Body() updateDto: UpdateLibraryDto) {
		return await this.notionPagesService.updateLibrary(updateDto);
	}

	@Delete('library-item/:notion_id')
	@UseGuards(ApiKeyGuard)
	async deleteLibraryItem(@Param('notion_id') notionId: string) {
		return await this.notionPagesService.deleteLibraryItem(notionId);
	}
}
