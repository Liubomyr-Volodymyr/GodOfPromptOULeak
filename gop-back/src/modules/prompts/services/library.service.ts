import { ForbiddenException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { PromptAccessPolicy, PromptAccessResult } from './prompt-access.policy';
import { Prompts } from '../../library/entities/prompts.entity';
import { PromptsTools } from '../../library/entities/prompts-tools.entity';
import { PromptComments } from '../../library/entities/prompt-comments.entity';
import { Tool } from '../../library/entities/tools.entity';
import { IPromptCommentView } from './comments.service';
import {
	ICategoriesListResponse,
	ILibraryService,
	IProductsListResponse,
	IPromptsListResponse,
	PromptDetailResponse,
	PromptListItem,
} from './library.interface';
import { PromptsQueryDto } from '../dto/prompts-query.dto';
import { ItemsQueryDto } from '../dto/items-query.dto';
import { Categories } from '../../library/entities/categories.entity';
import { Products } from '../../user-products/entities/products.entity';
import { ProductsQueryDto } from '../dto/products-query.dto';
import { ToolsService } from './tools.service';
import { toHttpError } from '../../../common/helpers/http-error.helper';
import { AudienceType } from '../../library/entities/audience-type.entity';
import {
	PROMPTS_DETAIL_RELATIONS,
	applyPromptsFilters,
	applyPromptsPagination,
	applyPromptsSort,
	createPromptsListQuery,
} from '../helpers/prompts-query.builder';

@Injectable()
export class LibraryService implements ILibraryService {
	constructor(
		@InjectRepository(Prompts)
		private readonly promptsRepo: Repository<Prompts>,
		@InjectRepository(Categories)
		private readonly categoryRepo: Repository<Categories>,
		@InjectRepository(Products)
		private readonly productsRepo: Repository<Products>,
		@InjectRepository(AudienceType)
		private readonly audienceTypeRepo: Repository<AudienceType>,
		private readonly promptAccessPolicy: PromptAccessPolicy,
		private readonly toolsService: ToolsService,
	) {}

	async findAll(dto: PromptsQueryDto): Promise<IPromptsListResponse> {
		try {
			const qb: SelectQueryBuilder<Prompts> = createPromptsListQuery(this.promptsRepo);

			applyPromptsFilters(qb, dto);
			applyPromptsSort(qb, dto);
			applyPromptsPagination(qb, dto);

			const [items, total]: [Prompts[], number] = await qb.getManyAndCount();

			return {
				data: items.map((item: Prompts): PromptListItem => this.toListItem(item)),
				meta: {
					total,
					limit: dto.limit,
					offset: dto.offset,
				},
			};
		} catch (error) {
			throw toHttpError(error, 'Failed to fetch prompts', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async findById(id: string, _userId: string | null): Promise<PromptDetailResponse> {
		const prompt: Prompts | null = await this.promptsRepo.findOne({
			where: { id },
			relations: PROMPTS_DETAIL_RELATIONS,
		});

		if (!prompt) throw new NotFoundException('Prompt not found');

		await this.promptsRepo.increment({ id: prompt.id }, 'viewsCount', 1);

		const accessResult: PromptAccessResult = await this.promptAccessPolicy.check(prompt);

		if (!accessResult.hasAccess) {
			throw new ForbiddenException('Prompt not public');
		}

		const { toolRelations, outputType, outputTypeId, comments, ...rest } = prompt;
		const tools: Tool[] = (toolRelations ?? []).map((tr: PromptsTools): Tool => tr.tool);
		const commentViews: IPromptCommentView[] = (comments ?? []).map(
			(comment: PromptComments): IPromptCommentView => ({
				id: comment.id,
				text: comment.text,
				commentator_id: comment.userId,
			}),
		);

		const merged: Record<string, unknown> = {
			...rest,
			tools,
			comments: commentViews,
			exampleOutputEmbed: '',
			output_type: outputType?.techName ?? null,
		};

		return Object.fromEntries(
			Object.keys(merged)
				.sort()
				.map((key: string): [string, unknown] => [key, merged[key]]),
		) as PromptDetailResponse;
	}

	private toListItem(prompt: Prompts): PromptListItem {
		const { outputType, outputTypeId, ...rest } = prompt;
		return {
			...rest,
			output_type: outputType?.techName ?? null,
		};
	}

	getTools(dto: ItemsQueryDto): Promise<{ data: Tool[] }> {
		return this.toolsService.findRecommended(dto.limit, dto.offset);
	}

	async getCategories(dto: ItemsQueryDto): Promise<ICategoriesListResponse> {
		try {
			const qb: SelectQueryBuilder<Categories> = this.categoryRepo.createQueryBuilder('categories');

			if (dto.limit !== -1) {
				qb.take(dto.limit || 100);
				qb.skip(dto.offset || 0);
			}

			qb.orderBy('categories.id', 'ASC');

			const data: Categories[] = await qb.getMany();

			return { data };
		} catch (error) {
			throw toHttpError(error, 'Failed to fetch categories', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getProducts(dto: ProductsQueryDto): Promise<IProductsListResponse> {
		try {
			const qb: SelectQueryBuilder<Products> = this.productsRepo.createQueryBuilder('product');

			if (dto.type) {
				qb.andWhere('product.type = :type', {
					type: dto.type,
				});
			}

			qb.orderBy(`product.${dto.sort || 'name'}`, 'ASC');

			if (dto.limit !== -1) {
				qb.take(dto.limit || 200);
				qb.skip(dto.offset || 0);
			}

			const data: Products[] = await qb.getMany();

			return { data };
		} catch (error) {
			throw toHttpError(error, 'Failed to fetch products', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getAudienceTypes(): Promise<AudienceType[]> {
		try {
			return await this.audienceTypeRepo.find({ order: { name: 'ASC' } });
		} catch (error) {
			throw toHttpError(error, 'Failed to fetch audience types', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getPromptAudienceTypes(promptId: string): Promise<AudienceType[]> {
		try {
			const prompt = await this.promptsRepo.findOne({
				where: { id: promptId },
				relations: { audienceTypeRelations: { audienceType: true } },
			});
			if (!prompt) throw new NotFoundException('Prompt not found');
			return (prompt.audienceTypeRelations ?? []).map((r) => r.audienceType);
		} catch (error) {
			if (error instanceof NotFoundException) throw error;
			throw toHttpError(error, 'Failed to fetch prompt audience types', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getToolBySlug(slug: string): Promise<Tool> {
		try {
			const tool = await this.toolsService.findBySlugs([slug]);
			if (!tool.length) throw new NotFoundException(`Tool not found: ${slug}`);
			return tool[0];
		} catch (error) {
			if (error instanceof NotFoundException) throw error;
			throw toHttpError(error, 'Failed to fetch tool', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
