import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Post, PostStatusEnum } from '../entities/post.entity';
import { PostTag } from '../entities/post-tag.entity';
import { PostAudienceType } from '../entities/post-audience-type.entity';
import { PostTool } from '../entities/post-tool.entity';
import { Tag } from '../entities/tag.entity';
import { Categories } from '../../library/entities/categories.entity';
import { Author } from '../../library/entities/authors.entity';
import { AudienceType } from '../../library/entities/audience-type.entity';
import { Tool } from '../../library/entities/tools.entity';
import { ImportPostDto, ImportPostsDto, ImportTagRefDto } from '../dto/import-posts.dto';
import { IDevPostsPage, IImportRowResult, IImportSummary, IPostsStats } from '../interfaces/import.interface';

interface ISlugRow {
	id: number;
	slug: string | null;
}

@Injectable()
export class BlogImportService {
	private readonly logger = new Logger(BlogImportService.name);

	constructor(
		@InjectRepository(Post)
		private readonly postsRepo: Repository<Post>,
		@InjectRepository(PostTag)
		private readonly postTagRepo: Repository<PostTag>,
		@InjectRepository(PostAudienceType)
		private readonly postAudienceTypeRepo: Repository<PostAudienceType>,
		@InjectRepository(PostTool)
		private readonly postToolRepo: Repository<PostTool>,
		@InjectRepository(Tag)
		private readonly tagsRepo: Repository<Tag>,
		@InjectRepository(Categories)
		private readonly categoriesRepo: Repository<Categories>,
		@InjectRepository(Author)
		private readonly authorsRepo: Repository<Author>,
		@InjectRepository(AudienceType)
		private readonly audienceTypesRepo: Repository<AudienceType>,
		@InjectRepository(Tool)
		private readonly toolsRepo: Repository<Tool>,
	) {}

	async importPosts(dto: ImportPostsDto): Promise<IImportSummary> {
		const createMissing: boolean = dto.create_missing_taxonomy ?? true;

		const categoryBySlug: Map<string, number> = await this.loadSlugMap(this.categoriesRepo);
		const authorBySlug: Map<string, number> = await this.loadSlugMap(this.authorsRepo);
		const audienceBySlug: Map<string, number> = await this.loadSlugMap(this.audienceTypesRepo);
		const toolBySlug: Map<string, number> = await this.loadSlugMap(this.toolsRepo);
		const tagBySlug: Map<string, number> = await this.loadSlugMap(this.tagsRepo);

		const results: IImportRowResult[] = [];
		const slugToId: Map<string, string> = new Map<string, string>();
		const relatedWork: Array<{ postId: string; relatedSlugs: string[] }> = [];

		for (const row of dto.posts) {
			try {
				const warnings: string[] = [];

				const categoryId: number | null = await this.resolveCategory(row, categoryBySlug, createMissing, warnings);
				const authorId: number | null = await this.resolveAuthor(row, authorBySlug, createMissing, warnings);

				const existing: Post | null = await this.postsRepo.findOne({ where: { slug: row.slug } });
				const isUpdate: boolean = !!existing;
				const post: Post = existing ?? this.postsRepo.create({ slug: row.slug });

				this.applyFields(post, row, categoryId, authorId);
				const saved: Post = await this.postsRepo.save(post);
				slugToId.set(saved.slug, saved.id);

				await this.syncTags(saved.id, row.tags, tagBySlug, createMissing, warnings);
				await this.syncAudienceTypes(saved.id, row.audience_type_slugs, audienceBySlug, warnings);
				await this.syncTools(saved.id, row.tool_slugs, toolBySlug, warnings);

				if (row.related_post_slugs?.length) {
					relatedWork.push({ postId: saved.id, relatedSlugs: row.related_post_slugs });
				}

				results.push({
					slug: row.slug,
					action: isUpdate ? 'updated' : 'created',
					id: saved.id,
					warnings: warnings.length ? warnings : undefined,
				});
			} catch (error) {
				const message: string = error instanceof Error ? error.message : 'Unknown import error';
				this.logger.warn(`Import failed for slug "${row.slug}": ${message}`);
				results.push({ slug: row.slug, action: 'failed', error: message });
			}
		}

		await this.applyRelated(relatedWork, slugToId);

		return {
			total: dto.posts.length,
			created: results.filter((result: IImportRowResult): boolean => result.action === 'created').length,
			updated: results.filter((result: IImportRowResult): boolean => result.action === 'updated').length,
			failed: results.filter((result: IImportRowResult): boolean => result.action === 'failed').length,
			results,
		};
	}

	async getStats(): Promise<IPostsStats> {
		const [total, published, draft, archived]: [number, number, number, number] = await Promise.all([
			this.postsRepo.count(),
			this.postsRepo.count({ where: { status: PostStatusEnum.PUBLISHED } }),
			this.postsRepo.count({ where: { status: PostStatusEnum.DRAFT } }),
			this.postsRepo.count({ where: { status: PostStatusEnum.ARCHIVED } }),
		]);
		return { total, published, draft, archived };
	}

	async listPosts(limit: number, offset: number, status?: PostStatusEnum): Promise<IDevPostsPage> {
		const [data, total]: [Post[], number] = await this.postsRepo.findAndCount({
			where: status ? { status } : {},
			select: {
				id: true,
				slug: true,
				title: true,
				status: true,
				publishedAt: true,
				modifiedAt: true,
				updatedAt: true,
				seoTitle: true,
				seoDescription: true,
				canonicalUrl: true,
				coverImageUrl: true,
				ogImageUrl: true,
				schemaType: true,
				seoStatus: true,
				readingTimeMinutes: true,
			},
			order: { publishedAt: 'DESC' },
			take: limit,
			skip: offset,
		});
		return {
			total,
			limit,
			offset,
			data: data.map((post: Post) => ({
				id: post.id,
				slug: post.slug,
				title: post.title,
				status: post.status,
				publishedAt: post.publishedAt,
				modifiedAt: post.modifiedAt,
				updatedAt: post.updatedAt,
				meta: {
					seoTitle: post.seoTitle,
					seoDescription: post.seoDescription,
					canonicalUrl: post.canonicalUrl,
					coverImageUrl: post.coverImageUrl,
					ogImageUrl: post.ogImageUrl,
					schemaType: post.schemaType,
					seoStatus: post.seoStatus,
					readingTimeMinutes: post.readingTimeMinutes,
				},
			})),
		};
	}

	private async loadSlugMap(repo: Repository<ISlugRow>): Promise<Map<string, number>> {
		const rows: ISlugRow[] = await repo.find({ select: { id: true, slug: true } as never });
		const map: Map<string, number> = new Map<string, number>();
		for (const row of rows) {
			if (row.slug) map.set(row.slug, row.id);
		}
		return map;
	}

	private async resolveCategory(
		row: ImportPostDto,
		cache: Map<string, number>,
		createMissing: boolean,
		warnings: string[],
	): Promise<number | null> {
		if (!row.category_slug) return null;

		const cached: number | undefined = cache.get(row.category_slug);
		if (cached !== undefined) return cached;

		if (!createMissing) {
			warnings.push(`category "${row.category_slug}" not found (skipped)`);
			return null;
		}

		const created: Categories = await this.categoriesRepo.save(
			this.categoriesRepo.create({ slug: row.category_slug, name: row.category_name ?? row.category_slug }),
		);
		cache.set(row.category_slug, created.id);
		return created.id;
	}

	private async resolveAuthor(
		row: ImportPostDto,
		cache: Map<string, number>,
		createMissing: boolean,
		warnings: string[],
	): Promise<number | null> {
		if (!row.author_slug) return null;

		const cached: number | undefined = cache.get(row.author_slug);
		if (cached !== undefined) return cached;

		if (!createMissing) {
			warnings.push(`author "${row.author_slug}" not found (skipped)`);
			return null;
		}

		const created: Author = await this.authorsRepo.save(
			this.authorsRepo.create({ slug: row.author_slug, name: row.author_name ?? row.author_slug }),
		);
		cache.set(row.author_slug, created.id);
		return created.id;
	}

	private async syncTags(
		postId: string,
		tags: ImportTagRefDto[] | undefined,
		cache: Map<string, number>,
		createMissing: boolean,
		warnings: string[],
	): Promise<void> {
		if (tags === undefined) return;
		await this.postTagRepo.delete({ postId });

		const ids: number[] = [];
		const seen: Set<string> = new Set<string>();
		for (const tag of tags) {
			if (seen.has(tag.slug)) continue;
			seen.add(tag.slug);

			const cached: number | undefined = cache.get(tag.slug);
			if (cached !== undefined) {
				ids.push(cached);
				continue;
			}
			if (!createMissing) {
				warnings.push(`tag "${tag.slug}" not found (skipped)`);
				continue;
			}
			const created: Tag = await this.tagsRepo.save(
				this.tagsRepo.create({ slug: tag.slug, name: tag.name ?? tag.slug, noindex: true }),
			);
			cache.set(tag.slug, created.id);
			ids.push(created.id);
		}

		if (!ids.length) return;
		await this.postTagRepo.save(ids.map((tagId: number): PostTag => this.postTagRepo.create({ postId, tagId })));
	}

	private async syncAudienceTypes(
		postId: string,
		slugs: string[] | undefined,
		cache: Map<string, number>,
		warnings: string[],
	): Promise<void> {
		if (slugs === undefined) return;
		await this.postAudienceTypeRepo.delete({ postId });
		const ids: number[] = this.slugsToIds(slugs, cache, 'audience type', warnings);
		if (!ids.length) return;
		await this.postAudienceTypeRepo.save(
			ids.map((audienceId: number): PostAudienceType => this.postAudienceTypeRepo.create({ postId, audienceId })),
		);
	}

	private async syncTools(postId: string, slugs: string[] | undefined, cache: Map<string, number>, warnings: string[]): Promise<void> {
		if (slugs === undefined) return;
		await this.postToolRepo.delete({ postId });
		const ids: number[] = this.slugsToIds(slugs, cache, 'tool', warnings);
		if (!ids.length) return;
		await this.postToolRepo.save(ids.map((toolId: number): PostTool => this.postToolRepo.create({ postId, toolId })));
	}

	private slugsToIds(slugs: string[], cache: Map<string, number>, label: string, warnings: string[]): number[] {
		const ids: number[] = [];
		for (const slug of [...new Set<string>(slugs)]) {
			const id: number | undefined = cache.get(slug);
			if (id === undefined) warnings.push(`${label} "${slug}" not found (skipped)`);
			else ids.push(id);
		}
		return ids;
	}

	private async applyRelated(work: Array<{ postId: string; relatedSlugs: string[] }>, slugToId: Map<string, string>): Promise<void> {
		if (!work.length) return;

		const unknown: Set<string> = new Set<string>();
		for (const { relatedSlugs } of work) {
			for (const slug of relatedSlugs) if (!slugToId.has(slug)) unknown.add(slug);
		}
		if (unknown.size) {
			const found: Post[] = await this.postsRepo.find({
				where: { slug: In([...unknown]) },
				select: { id: true, slug: true },
			});
			for (const post of found) slugToId.set(post.slug, post.id);
		}

		for (const { postId, relatedSlugs } of work) {
			const ids: string[] = [...new Set<string>(relatedSlugs)]
				.map((slug: string): string | undefined => slugToId.get(slug))
				.filter((id): id is string => !!id && id !== postId);
			await this.postsRepo.update({ id: postId }, { relatedPostIds: ids.length ? ids : null });
		}
	}

	private applyFields(post: Post, row: ImportPostDto, categoryId: number | null, authorId: number | null): void {
		post.title = row.title;
		post.excerpt = row.excerpt ?? null;
		post.body = row.body ?? '';
		post.coverImageUrl = row.cover_image_url ?? null;
		post.status = row.status ?? PostStatusEnum.DRAFT;
		post.featured = row.featured ?? false;
		post.readingTimeMinutes = row.reading_time_minutes ?? null;
		post.categoryId = categoryId;
		post.authorId = authorId;
		post.seoTitle = row.seo_title ?? null;
		post.seoDescription = row.seo_description ?? null;
		post.canonicalUrl = row.canonical_url ?? null;
		post.ogImageUrl = row.og_image_url ?? null;
		if (row.seo_status !== undefined) post.seoStatus = row.seo_status;
		post.schemaType = row.schema_type ?? 'Article';
		post.focusKeyword = row.focus_keyword ?? null;
		post.faqItems = row.faq_items ?? null;
		post.internalLinks = row.internal_links ?? null;
		post.publishedAt = row.published_at ? new Date(row.published_at) : null;
		post.modifiedAt = row.modified_at ? new Date(row.modified_at) : null;

		// keep only the original WP dates — never stamp the migration moment
		if (post.publishedAt) post.createdAt = post.publishedAt;
		const modifiedAt: Date | null = post.modifiedAt ?? post.publishedAt;
		if (modifiedAt) post.updatedAt = modifiedAt;
	}
}
