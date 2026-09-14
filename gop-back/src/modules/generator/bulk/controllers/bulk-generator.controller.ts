import { Body, Controller, ParseArrayPipe, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { ApiTags } from '@nestjs/swagger';
import { BulkInternalService } from '../services/bulk-internal.service';
import { FormatProcessRequest, InternalAiResult } from '../../dto/internal-prompts.dto';

@Throttle({ default: { limit: 30, ttl: 60000 } })
@ApiTags('Generator')
@Controller('generator')
export class BulkGeneratorController {
	constructor(private readonly bulkInternalService: BulkInternalService) {}

	@Post('format-bulk')
	@UseGuards(ApiKeyGuard)
	async formatBulk(
		@Body(new ParseArrayPipe({ items: FormatProcessRequest })) items: FormatProcessRequest[],
	): Promise<InternalAiResult[]> {
		return this.bulkInternalService.format(items);
	}
}
