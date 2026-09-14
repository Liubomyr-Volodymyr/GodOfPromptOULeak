import { Controller, Get, Param, ParseUUIDPipe, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { LibraryService } from '../services/library.service';
import { ApiCategoriesList, ApiProductsLibrary, ApiPromptInfo, ApiPromptsLibrary, ApiToolsList } from '../docs';
import { AudienceTypeResponseDto, ToolResponseDto } from '../docs/prompt-response.dto';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt.guard';
import { PromptsQueryDto } from '../dto/prompts-query.dto';
import { ItemsQueryDto } from '../dto/items-query.dto';
import { ProductsQueryDto } from '../dto/products-query.dto';
import { ICategoriesListResponse, IProductsListResponse, IPromptsListResponse, PromptDetailResponse } from '../services/library.interface';
import { Tool } from '../../library/entities/tools.entity';
import { AudienceType } from '../../library/entities/audience-type.entity';

@ApiTags('Prompts Library')
@Controller('library')
export class LibraryController {
	constructor(private readonly libraryService: LibraryService) {}

	@Get('prompts')
	@ApiPromptsLibrary()
	findAll(@Query() dto: PromptsQueryDto): Promise<IPromptsListResponse> {
		return this.libraryService.findAll(dto);
	}

	@Get('tools')
	@ApiToolsList()
	getTools(@Query() dto: ItemsQueryDto): Promise<{ data: Tool[] }> {
		return this.libraryService.getTools(dto);
	}

	@Get('categories')
	@ApiCategoriesList()
	getCategories(@Query() dto: ItemsQueryDto): Promise<ICategoriesListResponse> {
		return this.libraryService.getCategories(dto);
	}

	@Get('products')
	@ApiProductsLibrary()
	getProducts(@Query() dto: ProductsQueryDto): Promise<IProductsListResponse> {
		return this.libraryService.getProducts(dto);
	}

	@Get('audience-types')
	@ApiOperation({ summary: 'Get audience types list' })
	@ApiOkResponse({ type: [AudienceTypeResponseDto] })
	getAudienceTypes(): Promise<AudienceType[]> {
		return this.libraryService.getAudienceTypes();
	}

	@Get('tools/:slug')
	@ApiOperation({ summary: 'Get tool by slug' })
	@ApiOkResponse({ type: ToolResponseDto })
	getToolBySlug(@Param('slug') slug: string): Promise<Tool> {
		return this.libraryService.getToolBySlug(slug);
	}

	@Get(':id/audience-types')
	@ApiOperation({ summary: 'Get audience types of a prompt' })
	@ApiOkResponse({ type: [AudienceTypeResponseDto] })
	getPromptAudienceTypes(@Param('id', ParseUUIDPipe) id: string): Promise<AudienceType[]> {
		return this.libraryService.getPromptAudienceTypes(id);
	}

	@Get(':id')
	@ApiPromptInfo()
	@UseGuards(OptionalJwtAuthGuard)
	getPrompt(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request): Promise<PromptDetailResponse> {
		return this.libraryService.findById(id, req.user?.userId ?? null);
	}
}
