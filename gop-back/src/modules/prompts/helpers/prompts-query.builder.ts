import { FindOptionsRelations, Repository, SelectQueryBuilder } from 'typeorm';

import { Prompts } from '../../library/entities/prompts.entity';
import { PromptsQueryDto, PromptSortField, PromptStatusFilter, SortOrder } from '../dto/prompts-query.dto';
import { PromptCreationTypes } from '../dto/save-prompt.dto';

export const PROMPTS_DETAIL_RELATIONS: FindOptionsRelations<Prompts> = {
	toolRelations: { tool: true },
	promptFormat: true,
	inputFormat: true,
	outputType: true,
	comments: true,
};

export function createPromptsListQuery(repo: Repository<Prompts>): SelectQueryBuilder<Prompts> {
	return repo
		.createQueryBuilder('prompt')
		.leftJoinAndSelect('prompt.category', 'category')
		.leftJoinAndSelect('prompt.subCategory', 'subCategory')
		.leftJoinAndSelect('prompt.toolRelations', 'toolRelations')
		.leftJoinAndSelect('toolRelations.tool', 'tool')
		.leftJoinAndSelect('prompt.promptFormat', 'promptFormat')
		.leftJoinAndSelect('prompt.inputFormat', 'inputFormat')
		.leftJoinAndSelect('prompt.outputType', 'outputType');
}

export function applyPromptsFilters(qb: SelectQueryBuilder<Prompts>, dto: PromptsQueryDto): void {
	const statusFilter: PromptStatusFilter = dto.status ?? PromptStatusFilter.PUBLISHED;
	if (statusFilter !== PromptStatusFilter.ALL) {
		qb.andWhere('prompt.status = :_status', { _status: statusFilter });
	}

	if (dto.prompt_creation_type === PromptCreationTypes.INTERNAL) {
		qb.andWhere('prompt.user_id IS NULL');
	} else if (dto.prompt_creation_type === PromptCreationTypes.CUSTOM) {
		qb.andWhere('prompt.user_id IS NOT NULL');
	}

	if (dto.categorySlug) {
		qb.andWhere('category.slug = :categorySlug', { categorySlug: dto.categorySlug });
	}

	if (dto.subCategorySlug) {
		qb.andWhere('subCategory.slug = :subCategorySlug', { subCategorySlug: dto.subCategorySlug });
	}

	if (dto.search) {
		qb.andWhere(
			`(
				prompt.page_name ILIKE :search
				OR prompt.prompt_name ILIKE :search
				OR prompt.description ILIKE :search
			)`,
			{ search: `%${dto.search}%` },
		);
	}

	if (dto.tools?.length) {
		qb.andWhere('tool.slug IN (:...tools)', { tools: dto.tools });
	}

	// Output type ("text" | "image" | "presentation" | …). The outputType
	// relation is already joined in createPromptsListQuery, so this is a plain
	// predicate — and because it's an andWhere it composes with categorySlug /
	// audienceTypeSlug / tools and is reflected in meta.total.
	if (dto.output_type) {
		qb.andWhere('outputType.techName = :outputType', { outputType: dto.output_type });
	}

	if (dto.audienceTypeSlug) {
		qb.innerJoin('prompt.audienceTypeRelations', '_pat')
			.innerJoin('_pat.audienceType', '_at')
			.andWhere('_at.slug = :atSlug', { atSlug: dto.audienceTypeSlug });
	}
}

export function applyPromptsSort(qb: SelectQueryBuilder<Prompts>, dto: PromptsQueryDto): void {
	const sortMap: Record<PromptSortField, string> = {
		[PromptSortField.DATE_PUBLISHED]: 'prompt.datePublished',
		[PromptSortField.VIEWS_COUNT]: 'prompt.viewsCount',
	};

	const sortField: string = sortMap[dto?.sort] || 'prompt.datePublished';
	const order: 'ASC' | 'DESC' = dto.order === SortOrder.ASC ? 'ASC' : 'DESC';

	qb.orderBy(sortField, order);
}

export function applyPromptsPagination(qb: SelectQueryBuilder<Prompts>, dto: PromptsQueryDto): void {
	qb.skip(dto.offset || 0);
	qb.take(dto.limit || 24);
}
