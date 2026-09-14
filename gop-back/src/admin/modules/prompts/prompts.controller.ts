import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	Param,
	ParseArrayPipe,
	ParseIntPipe,
	ParseUUIDPipe,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PromptsService } from './services/prompts.service';
import { AdminPromptsService } from './services/admin-prompts.service';
import { PromptsCatalogService, ICategoryItem, IInputFormatItem } from './services/prompts-catalog.service';
import { Tool } from '../../../modules/library/entities/tools.entity';
import { IModeratorStats, IPromptListItem } from './interfaces/prompts.interfaces';
import { PaginationItems } from '../../common/dto/pagination.dto';
import { FindAllPromptsDto } from './dto/find-all-prompts.dto';
import { ModeratorStatsDto } from './dto/moderator-stats.dto';
import { CategoriesQueryDto } from '../../../modules/prompts/dto/categories-query.dto';
import { CreateCategoryDto } from '../../../modules/prompts/dto/create-category.dto';
import { CreateToolDto } from '../../../modules/prompts/dto/create-tool.dto';
import { UpdateToolDto } from '../../../modules/prompts/dto/update-tool.dto';
import { ToolsService } from '../../../modules/prompts/services/tools.service';
import { PromptsService as CatalogPromptsService } from '../../../modules/prompts/services/prompts.service';
import { UpdatePromptDto } from '../../../modules/prompts/dto/update-prompt.dto';
import { Prompts } from '../../../modules/library/entities/prompts.entity';
import { BulkInternalService } from '../../../modules/generator/bulk/services/bulk-internal.service';
import { InternalAiResult, InternalProcessRequest } from '../../../modules/generator/dto/internal-prompts.dto';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminRole, Roles } from '../../common/decorators/roles.decorator';
import { OutputTypes } from '../../../modules/user-products/entities/output-types.entity';
import { CreateOutputTypeDto } from '../../../modules/prompts/dto/create-output-type.dto';

const SELF_ONLY_ROLES: AdminRole[] = [AdminRole.Manager, AdminRole.Moderator];

@ApiTags('Prompts')
@ApiBearerAuth('access_token')
@Controller()
export class PromptsController {
	constructor(
		private readonly promptsService: PromptsService,
		private readonly adminPromptsService: AdminPromptsService,
		private readonly promptsCatalogService: PromptsCatalogService,
		private readonly bulkInternalService: BulkInternalService,
		private readonly toolsService: ToolsService,
		private readonly catalogPromptsService: CatalogPromptsService,
	) {}

	@Get('moderator-stats')
	@ApiOperation({ summary: 'Get prompt statistics grouped by moderator' })
	@ApiResponse({ status: 200, description: 'Moderator statistics returned successfully' })
	@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Moderator)
	@UseGuards(AdminJwtGuard, RolesGuard)
	async getModeratorStats(@Query() dto: ModeratorStatsDto): Promise<IModeratorStats[]> {
		return this.promptsService.getModeratorStats(dto);
	}

	@Get('formats')
	@ApiOperation({ summary: 'Get all prompt formats' })
	@ApiResponse({ status: 200, description: 'Prompt formats returned successfully' })
	@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Manager, AdminRole.Moderator)
	@UseGuards(AdminJwtGuard, RolesGuard)
	async getPromptFormats(): Promise<{ id: number; name: string }[]> {
		return this.adminPromptsService.getPromptFormats();
	}

	@Get('list')
	@ApiOperation({ summary: 'Get paginated list of prompts with estimated price' })
	@ApiResponse({ status: 200, description: 'Prompts list returned successfully' })
	@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Manager, AdminRole.Moderator)
	@UseGuards(AdminJwtGuard, RolesGuard)
	async getPromptsList(@Query() params: FindAllPromptsDto, @Req() req: any): Promise<PaginationItems<IPromptListItem>> {
		if (SELF_ONLY_ROLES.includes(req.user.role)) {
			params.moderatorId = await this.promptsCatalogService.resolveUserId(req.user.email);
		}
		return this.adminPromptsService.getPromptsList(params);
	}

	@Get('categories')
	@ApiOperation({ summary: 'Get categories list' })
	@ApiResponse({ status: 200, description: 'Categories returned successfully' })
	@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Manager, AdminRole.Moderator)
	@UseGuards(AdminJwtGuard, RolesGuard)
	async getCategories(@Query() query: CategoriesQueryDto): Promise<ICategoryItem[]> {
		return this.promptsCatalogService.getCategories(query);
	}

	@Post('categories')
	@ApiOperation({ summary: 'Create a category' })
	@ApiResponse({ status: 201, description: 'Category created successfully' })
	@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Manager, AdminRole.Moderator)
	@UseGuards(AdminJwtGuard, RolesGuard)
	async createCategory(@Body() dto: CreateCategoryDto): Promise<ICategoryItem> {
		return this.promptsCatalogService.createCategory(dto);
	}

	@Post('tools')
	@ApiOperation({ summary: 'Create a tool' })
	@ApiResponse({ status: 201, description: 'Tool created successfully' })
	@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Manager, AdminRole.Moderator)
	@UseGuards(AdminJwtGuard, RolesGuard)
	async createTool(@Body() dto: CreateToolDto): Promise<Tool> {
		return this.toolsService.create(dto);
	}

	@Patch('tools/:id')
	@ApiOperation({ summary: 'Update a tool' })
	@ApiResponse({ status: 200, description: 'Tool updated successfully' })
	@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Manager, AdminRole.Moderator)
	@UseGuards(AdminJwtGuard, RolesGuard)
	async updateTool(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateToolDto): Promise<Tool> {
		return this.toolsService.update(id, dto);
	}

	@Delete('tools/:id')
	@ApiOperation({ summary: 'Delete a tool' })
	@ApiResponse({ status: 200, description: 'Tool deleted successfully' })
	@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Manager, AdminRole.Moderator)
	@UseGuards(AdminJwtGuard, RolesGuard)
	async deleteTool(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
		return this.toolsService.delete(id);
	}

	@Post('output-type')
	@ApiOperation({ summary: 'Create new output-type' })
	@ApiBody({
		type: CreateOutputTypeDto,
		examples: {
			default: { summary: 'Create output type', value: { name: 'New Type', techName: 'new_type' } },
		},
	})
	@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Manager, AdminRole.Moderator)
	@UseGuards(AdminJwtGuard, RolesGuard)
	async createOutputType(@Body() dto: CreateOutputTypeDto): Promise<OutputTypes> {
		return this.promptsCatalogService.createOutputType(dto);
	}

	@Get('input-formats')
	@ApiOperation({ summary: 'Get all input formats' })
	@ApiResponse({ status: 200, description: 'Input formats returned successfully' })
	@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Manager, AdminRole.Moderator)
	@UseGuards(AdminJwtGuard, RolesGuard)
	async getInputFormats(): Promise<IInputFormatItem[]> {
		return this.promptsCatalogService.getInputFormats();
	}

	@Patch('prompt/:id')
	@ApiOperation({ summary: 'Update a prompt by ID' })
	@ApiResponse({ status: 200, description: 'Prompt updated successfully' })
	@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Manager, AdminRole.Moderator)
	@UseGuards(AdminJwtGuard, RolesGuard)
	async updatePrompt(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePromptDto): Promise<Prompts> {
		return this.catalogPromptsService.updatePrompt(id, dto);
	}

	@Post('bulk-create')
	@ApiOperation({ summary: 'Create prompts in bulk (one per item, generated internally)' })
	@ApiResponse({ status: 201, description: 'Prompts generated and saved as pending' })
	@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Manager, AdminRole.Moderator)
	@UseGuards(AdminJwtGuard, RolesGuard)
	async createBulkPrompt(
		@Body(new ParseArrayPipe({ items: InternalProcessRequest })) items: InternalProcessRequest[],
		@Req() req: any,
	): Promise<InternalAiResult[]> {
		if (SELF_ONLY_ROLES.includes(req.user.role)) {
			const ownUuid: string = await this.promptsCatalogService.resolveUserId(req.user.email);
			const foreign: InternalProcessRequest | undefined = items.find(
				(item: InternalProcessRequest): boolean => item.author !== ownUuid,
			);
			if (foreign) {
				throw new ForbiddenException('You can only create prompts under your own name');
			}
		}
		return this.bulkInternalService.run(items);
	}
}
