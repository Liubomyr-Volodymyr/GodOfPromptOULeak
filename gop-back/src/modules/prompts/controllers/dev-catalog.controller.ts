import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DevOnlyGuard } from '../../../common/guards/dev-only.guard';
import { PromptsService } from '../services/prompts.service';
import { ToolsService } from '../services/tools.service';
import { CatalogService, IInputFormatItem } from '../services/catalog.service';
import { UpdateNamedTechDto } from '../dto/named-tech.dto';
import { UpdateToolDto } from '../dto/update-tool.dto';
import { UpdatePromptDto } from '../dto/update-prompt.dto';
import { CreatePromptDto } from '../dto/create-prompt.dto';
import { CreateAudienceTypeDto, UpdateAudienceTypeDto } from '../dto/audience-type.dto';
import { InputFormat } from '../../library/entities/input-format.entity';
import { PromptFormat } from '../../library/entities/prompt-format.entity';
import { OutputTypes } from '../../user-products/entities/output-types.entity';
import { Tool } from '../../library/entities/tools.entity';
import { Prompts } from '../../library/entities/prompts.entity';
import { AudienceType } from '../../library/entities/audience-type.entity';
import { Categories } from '../../library/entities/categories.entity';

@ApiTags('Dev Catalog')
@Controller('dev/catalog')
@UseGuards(DevOnlyGuard)
export class DevCatalogController {
	constructor(
		private readonly promptsService: PromptsService,
		private readonly toolsService: ToolsService,
		private readonly catalogService: CatalogService,
	) {}

	@Patch('input-format/:id')
	updateInputFormat(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNamedTechDto): Promise<InputFormat> {
		return this.catalogService.updateInputFormat(id, dto);
	}

	@Delete('input-format/:id')
	deleteInputFormat(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
		return this.catalogService.deleteInputFormat(id);
	}

	@Get('output-type')
	@ApiOperation({ summary: 'List output types' })
	@ApiOkResponse({ description: 'Output types fetched successfully' })
	listOutputTypes(): Promise<IInputFormatItem[]> {
		return this.catalogService.listOutputTypes();
	}

	@Patch('output-type/:id')
	updateOutputType(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNamedTechDto): Promise<OutputTypes> {
		return this.catalogService.updateOutputType(id, dto);
	}

	@Delete('output-type/:id')
	deleteOutputType(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
		return this.catalogService.deleteOutputType(id);
	}

	@Patch('prompt-format/:id')
	updatePromptFormat(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNamedTechDto): Promise<PromptFormat> {
		return this.catalogService.updatePromptFormat(id, dto);
	}

	@Delete('prompt-format/:id')
	deletePromptFormat(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
		return this.catalogService.deletePromptFormat(id);
	}

	@Post('prompt')
	createPrompt(@Body() dto: CreatePromptDto): Promise<Prompts> {
		return this.promptsService.createPrompt(dto);
	}

	@Patch('prompt/:id')
	updatePrompt(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePromptDto): Promise<Prompts> {
		return this.promptsService.updatePrompt(id, dto);
	}

	@Delete('prompt/:id')
	deletePrompt(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
		return this.promptsService.deletePrompt(id);
	}

	@Post('prompt/:id/audience-type')
	addAudienceType(
		@Param('id', ParseUUIDPipe) id: string,
		@Body('audience_type_id', ParseIntPipe) audienceTypeId: number,
	): Promise<{ success: boolean }> {
		return this.promptsService.addAudienceType(id, audienceTypeId);
	}

	@Delete('prompt/:id/audience-type/:atId')
	removeAudienceType(@Param('id', ParseUUIDPipe) id: string, @Param('atId', ParseIntPipe) atId: number): Promise<{ success: boolean }> {
		return this.promptsService.removeAudienceType(id, atId);
	}

	@Patch('category/:id')
	updateCategory(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: { name?: string; slug?: string; parent?: number | null },
	): Promise<Categories> {
		return this.catalogService.updateCategory(id, dto);
	}

	@Delete('category/:id')
	deleteCategory(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
		return this.catalogService.deleteCategory(id);
	}

	@Patch('tool/:id')
	updateTool(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateToolDto): Promise<Tool> {
		return this.toolsService.update(id, dto);
	}

	@Delete('tool/:id')
	deleteTool(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
		return this.toolsService.delete(id);
	}

	@Get('audience-type')
	listAudienceTypes(): Promise<AudienceType[]> {
		return this.catalogService.listAudienceTypes();
	}

	@Post('audience-type')
	createAudienceType(@Body() dto: CreateAudienceTypeDto): Promise<AudienceType> {
		return this.catalogService.createAudienceType(dto);
	}

	@Patch('audience-type/:id')
	updateAudienceType(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAudienceTypeDto): Promise<AudienceType> {
		return this.catalogService.updateAudienceType(id, dto);
	}

	@Delete('audience-type/:id')
	deleteAudienceType(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
		return this.catalogService.deleteAudienceType(id);
	}
}
