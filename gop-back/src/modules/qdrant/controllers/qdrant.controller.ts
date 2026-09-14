import { Body, Controller, Delete, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { AddDataDto, SyncPromptsDto, SearchDataDto } from '../dto/qdrant.dto';
import { QdrantService } from '../services/qdrant.service';
import { QdrantClientService } from '../services/qdrant-client.service';
import { ApiTags } from '@nestjs/swagger';
import SuccessDto from '../../../common/dto/success.dto';
import { PromptsDto } from '../../prompts/dto/prompts.dto';
import { QdrantSyncService } from '../services/qdrant-sync.service';
import { Prompts } from '../../library/entities/prompts.entity';

@ApiTags('Qdrant')
@Controller('qdrant')
export class QdrantController {
	constructor(
		private readonly qdrantClientService: QdrantClientService,
		private readonly qdrantService: QdrantService,
		private readonly qdrantSyncService: QdrantSyncService,
	) {}

	@Post('add')
	@UseGuards(ApiKeyGuard)
	async addData(@Body() addDataDto: AddDataDto): Promise<SuccessDto> {
		const result = await this.qdrantService.addData(addDataDto);
		return { success: result };
	}

	@Post('vectorize-prompts')
	@UseGuards(ApiKeyGuard)
	async vectorizePrompts(@Body() dataDto: SyncPromptsDto): Promise<Prompts[]> {
		return this.qdrantSyncService.syncPrompts(dataDto);
	}

	@Throttle({ default: { limit: 50, ttl: 60000 } })
	@Post('search')
	async searchData(@Body() searchDataDto: SearchDataDto): Promise<PromptsDto[]> {
		return await this.qdrantService.searchData(searchDataDto.search, searchDataDto.category, searchDataDto.sub_category);
	}

	@Delete(':id')
	@UseGuards(ApiKeyGuard)
	async deleteData(@Param('id', ParseIntPipe) id: number): Promise<SuccessDto> {
		const result = await this.qdrantService.deleteData(id);
		return { success: result };
	}

	@Delete('/collection/:collectionName')
	@UseGuards(ApiKeyGuard)
	async deleteCollection(@Param('collectionName') collectionName: string): Promise<SuccessDto> {
		await this.qdrantClientService.deleteCollection(collectionName);
		return { success: true };
	}
}
