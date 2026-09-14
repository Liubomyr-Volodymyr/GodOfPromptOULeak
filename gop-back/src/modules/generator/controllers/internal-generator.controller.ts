import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { DevOnlyGuard } from 'src/common/guards/dev-only.guard';
import { InternalGeneratorService } from '../services/internal-generator.service';
import { FormatProcessRequest, InternalAiResult, InternalProcessRequest } from '../dto/internal-prompts.dto';
import { DescribeRequest } from '../dto/describe.dto';
import { AddPromptToDbDto } from '../dto/add-to-db.dto';
import { PromptsService } from '../../prompts/services/prompts.service';
import { ApiTags } from '@nestjs/swagger';

@Throttle({ default: { limit: 30, ttl: 60000 } })
@ApiTags('Generator')
@Controller('generator')
export class InternalGeneratorController {
	constructor(
		private readonly internalGeneratorService: InternalGeneratorService,
		private readonly promptsService: PromptsService,
	) {}

	@Post('internal')
	@UseGuards(ApiKeyGuard)
	async internal(@Body() dataDto: InternalProcessRequest): Promise<InternalAiResult> {
		return this.internalGeneratorService.processInternal(dataDto);
	}

	@Post('format')
	@UseGuards(ApiKeyGuard)
	async format(@Body() dataDto: FormatProcessRequest): Promise<InternalAiResult> {
		return this.internalGeneratorService.processFormat(dataDto);
	}

	@Post('describe')
	@UseGuards(ApiKeyGuard)
	async describe(@Body() dto: DescribeRequest): Promise<InternalAiResult> {
		return this.internalGeneratorService.processDescribe(dto);
	}

	@Post('add-to-db')
	@UseGuards(DevOnlyGuard)
	async addToDb(@Body() dto: AddPromptToDbDto): Promise<{ id: string }> {
		return this.promptsService.insertReadyPrompt(dto);
	}
}
