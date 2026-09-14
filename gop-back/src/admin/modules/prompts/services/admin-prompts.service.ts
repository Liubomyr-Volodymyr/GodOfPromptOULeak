import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';

import { IPromptListItem } from '../interfaces/prompts.interfaces';
import { PaginationItems, PaginationMeta } from '../../../common/dto/pagination.dto';
import { FindAllPromptsDto, PromptSortBy, AuthorTypeFilter } from '../dto/find-all-prompts.dto';
import { ModelPricingService } from '../../../../modules/ai/services/model-pricing.service';
import { SortOrder } from '../../../../common/enums';

import { Prompts } from '../../../../modules/library/entities/prompts.entity';
import { User } from '../../../../modules/users/entities/users.entity';
import { CatalogService } from '../../../../modules/prompts/services/catalog.service';

const PROMPT_TEXT_FIELDS: readonly (keyof Prompts)[] = [
	'promptName',
	'promptBody',
	'description',
	'whatThisPromptDoes',
	'tips',
	'seoDescription',
	'howToUseThePrompt',
] as const;

const DEFAULT_MODEL = 'openai/gpt-4o';

@Injectable()
export class AdminPromptsService {
	constructor(
		@InjectRepository(Prompts)
		private readonly promptRepo: Repository<Prompts>,
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
		private readonly modelPricing: ModelPricingService,
		private readonly catalogService: CatalogService,
	) {}

	async getPromptsList(params: FindAllPromptsDto): Promise<PaginationItems<IPromptListItem>> {
		const page = params.page ?? 1;
		const limit = params.limit ?? 20;
		const offset = (page - 1) * limit;

		const sortBy = params.sortBy ?? PromptSortBy.DATE_CREATED;
		const sortOrder: SortOrder = params.sortOrder ?? SortOrder.DESC;

		try {
			const qb = this.promptRepo
				.createQueryBuilder('p')
				.leftJoinAndSelect('p.promptFormat', 'pf')
				.leftJoinAndSelect('p.category', 'c')
				.leftJoinAndSelect('p.subCategory', 'sc');

			if (params.search) {
				qb.andWhere(
					new Brackets((qb1) => {
						qb1.where('p.promptName ILIKE :search', { search: `%${params.search}%` }).orWhere('p.pageName ILIKE :search', {
							search: `%${params.search}%`,
						});
					}),
				);
			}

			if (params.moderatorId) {
				qb.andWhere('p.moderatorId = :moderatorId', {
					moderatorId: params.moderatorId,
				});
			} else if (params.authorType === AuthorTypeFilter.MODERATOR) {
				qb.andWhere('p.moderatorId IS NOT NULL');
			} else if (params.authorType === AuthorTypeFilter.USER) {
				qb.andWhere('p.moderatorId IS NULL');
			}

			if (params.promptFormatIds?.length) {
				qb.andWhere('p.promptFormatId IN (:...ids)', {
					ids: params.promptFormatIds,
				});
			}

			const sortMap = {
				[PromptSortBy.PROMPT_NAME]: 'p.promptName',
				[PromptSortBy.STATUS]: 'p.status',
				[PromptSortBy.DATE_PUBLISHED]: 'p.datePublished',
				[PromptSortBy.DATE_CREATED]: 'p.dateCreated',
				[PromptSortBy.VIEWS_COUNT]: 'p.viewsCount',
				[PromptSortBy.LIKES_COUNT]: 'p.likesCount',
			};

			qb.orderBy(sortMap[sortBy] ?? 'p.dateCreated', sortOrder.toUpperCase() as Uppercase<SortOrder>);

			qb.skip(offset).take(limit);

			const [prompts, total] = await qb.getManyAndCount();

			const promptIds: string[] = prompts.map((p: Prompts) => p.id);
			const [likeCounts, bookmarkCounts, commentCounts]: [Map<string, number>, Map<string, number>, Map<string, number>] =
				await Promise.all([
					this.countByPrompt('prompt_likes', promptIds),
					this.countByPrompt('prompt_bookmarks', promptIds),
					this.countByPrompt('prompt_comments', promptIds),
				]);

			const moderatorIds = [...new Set(prompts.map((p) => p.moderatorId).filter(Boolean))];
			const userIds = [...new Set(prompts.map((p) => p.userId).filter(Boolean))];

			const [moderators, users] = await Promise.all([
				moderatorIds.length
					? this.userRepo.find({
							where: { id: In(moderatorIds as string[]) },
							select: ['id', 'firstName', 'lastName'],
						})
					: [],
				userIds.length
					? this.userRepo.find({
							where: { id: In(userIds as string[]) },
						})
					: [],
			]);

			const moderatorsMap = new Map(moderators.map((u) => [u.id, u]));
			const usersMap = new Map(users.map((u) => [u.id, u]));

			const items: IPromptListItem[] = prompts.map((p: Prompts) => {
				let authorName = '—';

				if (p.moderatorId) {
					const mod = moderatorsMap.get(p.moderatorId);
					authorName = mod ? `${mod.firstName ?? ''} ${mod.lastName ?? ''}`.trim() || '—' : '—';
				} else if (p.userId) {
					const user = usersMap.get(p.userId);
					authorName = user?.primaryEmail?.email ?? '—';
				}

				const textFields = PROMPT_TEXT_FIELDS.map((field) => (p[field] as string) ?? '');

				const price = this.modelPricing.estimatePromptCost(textFields, DEFAULT_MODEL);

				const isEstimated = true;

				return {
					id: p.id,
					page_name: p.pageName ?? '',
					prompt_name: p.promptName ?? '',
					author_name: authorName,
					author_type: p.moderatorId ? 'moderator' : 'user',
					price,
					is_estimated: isEstimated,
					status: p.status ?? 'draft',
					views_count: p.viewsCount ?? 0,
					likes_count: likeCounts.get(p.id) ?? 0,
					bookmarks_count: bookmarkCounts.get(p.id) ?? 0,
					comments_count: commentCounts.get(p.id) ?? 0,
					prompt_format: p.promptFormat?.name ?? '—',
					category_name: p.category?.name ?? null,
					sub_category_name: p.subCategory?.name ?? null,
					is_premium: p.isPremium ?? null,
					date_created: p.dateCreated?.toDateString() ?? null,
					date_published: p.datePublished?.toDateString() ?? null,
				};
			});

			const meta: PaginationMeta = {
				total,
				page,
				limit,
				pageCount: Math.ceil(total / limit),
				hasNextPage: offset + limit < total,
			};

			return { items, meta };
		} catch (e) {
			throw new HttpException('Failed to fetch prompts list', HttpStatus.BAD_GATEWAY);
		}
	}

	private async countByPrompt(
		table: 'prompt_likes' | 'prompt_bookmarks' | 'prompt_comments',
		promptIds: string[],
	): Promise<Map<string, number>> {
		if (!promptIds.length) return new Map<string, number>();

		const rows: Array<{ prompt_id: string; count: string }> = await this.promptRepo.manager.query(
			`SELECT prompt_id, COUNT(*)::int AS count FROM ${table} WHERE prompt_id = ANY($1) GROUP BY prompt_id`,
			[promptIds],
		);

		return new Map<string, number>(
			rows.map((row: { prompt_id: string; count: string }): [string, number] => [row.prompt_id, Number(row.count)]),
		);
	}

	getPromptFormats(): Promise<{ id: number; name: string }[]> {
		return this.catalogService.getPromptFormats();
	}
}
