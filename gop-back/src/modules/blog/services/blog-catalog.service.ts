import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { Author } from '../../library/entities/authors.entity';
import { Post, PostStatusEnum } from '../entities/post.entity';
import { PostTag } from '../entities/post-tag.entity';
import { PostAudienceType } from '../entities/post-audience-type.entity';
import { PostTool } from '../entities/post-tool.entity';
import { PostPrompt } from '../entities/post-prompt.entity';
import { PostProduct } from '../entities/post-product.entity';
import { Tag } from '../entities/tag.entity';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { CreateTagDto, UpdateTagDto } from '../dto/tag.dto';
import { AdminPostSortField, AdminPostsQueryDto } from '../dto/admin-posts-query.dto';
import { AdminPostListItemDto, AdminPostsPageDto, AuthorStatsDto } from '../dto/admin-blog.dto';
import { SortOrder } from '../dto/posts-query.dto';
import { POST_DETAIL_RELATIONS } from '../helpers/posts-query.builder';
import { toHttpError } from '../../../common/helpers/http-error.helper';

interface IAuthorStatsRawRow {
	id: number;
	name: string;
	postsCount: string;
	lastPublishedAt: Date | null;
}

@Injectable()
export class BlogCatalogService {
	constructor(
		@InjectRepository(Post)
		private readonly postsRepo: Repository<Post>,
		@InjectRepository(Author)
		private readonly authorsRepo: Repository<Author>,
		@InjectRepository(Tag)
		private readonly tagsRepo: Repository<Tag>,
		@InjectRepository(PostTag)
		private readonly postTagRepo: Repository<PostTag>,
		@InjectRepository(PostAudienceType)
		private readonly postAudienceTypeRepo: Repository<PostAudienceType>,
		@InjectRepository(PostTool)
		private readonly postToolRepo: Repository<PostTool>,
		@InjectRepository(PostPrompt)
		private readonly postPromptRepo: Repository<PostPrompt>,
		@InjectRepository(PostProduct)
		private readonly postProductRepo: Repository<PostProduct>,
	) {}

	// ---------- Posts ----------

	async createPost(dto: CreatePostDto): Promise<Post> {
		const dup: Post | null = await this.postsRepo.findOne({ where: { slug: dto.slug } });
		if (dup) {
			throw new HttpException(`Post with slug "${dto.slug}" already exists`, HttpStatus.CONFLICT);
		}

		try {
			const post: Post = this.postsRepo.create(this.mapPostFields(dto));

			// Auto-stamp publishedAt when created straight to published
			if (post.status === PostStatusEnum.PUBLISHED && !post.publishedAt) {
				post.publishedAt = new Date();
			}

			const saved: Post = await this.postsRepo.save(post);

			await this.syncTags(saved.id, dto.tag_ids);
			await this.syncAudienceTypes(saved.id, dto.audience_type_ids);
			await this.syncTools(saved.id, dto.tool_ids);
			await this.syncPrompts(saved.id, dto.prompt_ids);
			await this.syncProducts(saved.id, dto.product_ids);

			return this.getPostOrThrow(saved.id);
		} catch (error) {
			throw toHttpError(error, 'Failed to create post');
		}
	}

	async updatePost(id: string, dto: UpdatePostDto): Promise<Post> {
		const post: Post | null = await this.postsRepo.findOne({ where: { id } });
		if (!post) throw new NotFoundException('Post not found');

		if (dto.slug && dto.slug !== post.slug) {
			const dup: Post | null = await this.postsRepo.findOne({ where: { slug: dto.slug } });
			if (dup) throw new HttpException(`Post with slug "${dto.slug}" already exists`, HttpStatus.CONFLICT);
		}

		try {
			const wasPublished: boolean = post.status === PostStatusEnum.PUBLISHED;
			this.postsRepo.merge(post, this.mapPostFields(dto));

			// Auto-stamp publishedAt the first time a post goes published
			if (!wasPublished && post.status === PostStatusEnum.PUBLISHED && !post.publishedAt) {
				post.publishedAt = new Date();
			}

			// touch_updated_at DB trigger was dropped; bump in-app for real edits
			post.updatedAt = new Date();

			await this.postsRepo.save(post);

			if (dto.tag_ids !== undefined) await this.syncTags(id, dto.tag_ids);
			if (dto.audience_type_ids !== undefined) await this.syncAudienceTypes(id, dto.audience_type_ids);
			if (dto.tool_ids !== undefined) await this.syncTools(id, dto.tool_ids);
			if (dto.prompt_ids !== undefined) await this.syncPrompts(id, dto.prompt_ids);
			if (dto.product_ids !== undefined) await this.syncProducts(id, dto.product_ids);

			return this.getPostOrThrow(id);
		} catch (error) {
			throw toHttpError(error, 'Failed to update post');
		}
	}

	getPostForAdmin(id: string): Promise<Post> {
		return this.getPostOrThrow(id);
	}

	async deletePost(id: string): Promise<{ success: boolean }> {
		const post: Post | null = await this.postsRepo.findOne({ where: { id } });
		if (!post) throw new NotFoundException('Post not found');

		try {
			await this.postsRepo.remove(post);
			return { success: true };
		} catch (error) {
			throw toHttpError(error, 'Failed to delete post');
		}
	}

	async listPostsForAdmin(dto: AdminPostsQueryDto): Promise<AdminPostsPageDto> {
		try {
			const queryBuilder: SelectQueryBuilder<Post> = this.postsRepo
				.createQueryBuilder('post')
				.leftJoinAndSelect('post.author', 'author')
				.leftJoinAndSelect('post.category', 'category');

			if (dto.status) {
				queryBuilder.andWhere('post.status = :status', { status: dto.status });
			}

			if (dto.authorId !== undefined) {
				queryBuilder.andWhere('post.author_id = :authorId', { authorId: dto.authorId });
			}

			if (dto.search) {
				queryBuilder.andWhere('(post.title ILIKE :search OR post.slug ILIKE :search)', { search: `%${dto.search}%` });
			}

			const sortMap: Record<AdminPostSortField, string> = {
				[AdminPostSortField.PUBLISHED_AT]: 'post.publishedAt',
				[AdminPostSortField.CREATED_AT]: 'post.createdAt',
				[AdminPostSortField.UPDATED_AT]: 'post.updatedAt',
				[AdminPostSortField.TITLE]: 'post.title',
			};
			const sortField: string = sortMap[dto.sort] || 'post.createdAt';
			const order: 'ASC' | 'DESC' = dto.order === SortOrder.ASC ? 'ASC' : 'DESC';

			queryBuilder.orderBy(sortField, order, 'NULLS LAST');
			queryBuilder.skip(dto.offset || 0).take(dto.limit || 24);

			const [items, total]: [Post[], number] = await queryBuilder.getManyAndCount();

			return {
				data: items.map(
					(post: Post): AdminPostListItemDto => ({
						id: post.id,
						slug: post.slug,
						title: post.title,
						status: post.status,
						featured: post.featured,
						authorId: post.authorId,
						authorName: post.author?.name ?? null,
						categoryName: post.category?.name ?? null,
						coverImageUrl: post.coverImageUrl,
						ogImageUrl: post.ogImageUrl,
						publishedAt: post.publishedAt,
						createdAt: post.createdAt,
						updatedAt: post.updatedAt,
					}),
				),
				meta: {
					total,
					limit: dto.limit,
					offset: dto.offset,
				},
			};
		} catch (error) {
			throw toHttpError(error, 'Failed to fetch posts');
		}
	}

	async listAuthorStats(): Promise<AuthorStatsDto[]> {
		try {
			const rows: IAuthorStatsRawRow[] = await this.authorsRepo
				.createQueryBuilder('author')
				.leftJoin(Post, 'post', 'post.author_id = author.id')
				.select('author.id', 'id')
				.addSelect('author.name', 'name')
				.addSelect('COUNT(post.id)', 'postsCount')
				.addSelect('MAX(post.published_at) FILTER (WHERE post.status = :published)', 'lastPublishedAt')
				.setParameter('published', PostStatusEnum.PUBLISHED)
				.groupBy('author.id')
				.addGroupBy('author.name')
				.orderBy('COUNT(post.id)', 'DESC')
				.addOrderBy('author.name', 'ASC')
				.getRawMany<IAuthorStatsRawRow>();

			return rows.map(
				(row: IAuthorStatsRawRow): AuthorStatsDto => ({
					id: row.id,
					name: row.name,
					// reason: COUNT() surfaces as a string in raw Postgres rows
					postsCount: Number(row.postsCount),
					lastPublishedAt: row.lastPublishedAt,
				}),
			);
		} catch (error) {
			throw toHttpError(error, 'Failed to fetch author stats');
		}
	}

	// ---------- Tags ----------

	listTags(): Promise<Tag[]> {
		return this.tagsRepo.find({ order: { name: 'ASC' } });
	}

	async createTag(dto: CreateTagDto): Promise<Tag> {
		const dup: Tag | null = await this.tagsRepo.findOne({ where: { slug: dto.slug } });
		if (dup) throw new HttpException(`Tag with slug "${dto.slug}" already exists`, HttpStatus.CONFLICT);

		try {
			return await this.tagsRepo.save(this.tagsRepo.create(dto));
		} catch (error) {
			throw toHttpError(error, 'Failed to create tag');
		}
	}

	async updateTag(id: number, dto: UpdateTagDto): Promise<Tag> {
		const tag: Tag | null = await this.tagsRepo.findOne({ where: { id } });
		if (!tag) throw new NotFoundException('Tag not found');

		if (dto.slug && dto.slug !== tag.slug) {
			const dup: Tag | null = await this.tagsRepo.findOne({ where: { slug: dto.slug } });
			if (dup) throw new HttpException(`Tag with slug "${dto.slug}" already exists`, HttpStatus.CONFLICT);
		}

		try {
			this.tagsRepo.merge(tag, dto);
			return await this.tagsRepo.save(tag);
		} catch (error) {
			throw toHttpError(error, 'Failed to update tag');
		}
	}

	async deleteTag(id: number): Promise<{ success: boolean }> {
		const tag: Tag | null = await this.tagsRepo.findOne({ where: { id } });
		if (!tag) throw new NotFoundException('Tag not found');

		try {
			await this.tagsRepo.remove(tag);
			return { success: true };
		} catch (error) {
			throw toHttpError(error, 'Failed to delete tag');
		}
	}

	// ---------- helpers ----------

	private async getPostOrThrow(id: string): Promise<Post> {
		const post: Post | null = await this.postsRepo.findOne({ where: { id }, relations: POST_DETAIL_RELATIONS });
		if (!post) throw new NotFoundException('Post not found');
		return post;
	}

	private async syncTags(postId: string, tagIds?: number[]): Promise<void> {
		if (tagIds === undefined) return;
		await this.postTagRepo.delete({ postId });
		if (!tagIds.length) return;
		const unique: number[] = [...new Set(tagIds)];
		await this.postTagRepo.save(unique.map((tagId: number): PostTag => this.postTagRepo.create({ postId, tagId })));
	}

	private async syncAudienceTypes(postId: string, audienceIds?: number[]): Promise<void> {
		if (audienceIds === undefined) return;
		await this.postAudienceTypeRepo.delete({ postId });
		if (!audienceIds.length) return;
		const unique: number[] = [...new Set(audienceIds)];
		await this.postAudienceTypeRepo.save(
			unique.map((audienceId: number): PostAudienceType => this.postAudienceTypeRepo.create({ postId, audienceId })),
		);
	}

	private async syncTools(postId: string, toolIds?: number[]): Promise<void> {
		if (toolIds === undefined) return;
		await this.postToolRepo.delete({ postId });
		if (!toolIds.length) return;
		const unique: number[] = [...new Set(toolIds)];
		await this.postToolRepo.save(unique.map((toolId: number): PostTool => this.postToolRepo.create({ postId, toolId })));
	}

	private async syncPrompts(postId: string, promptIds?: string[]): Promise<void> {
		if (promptIds === undefined) return;
		await this.postPromptRepo.delete({ postId });
		if (!promptIds.length) return;
		const unique: string[] = [...new Set(promptIds)];
		await this.postPromptRepo.save(
			unique.map((promptId: string, index: number): PostPrompt => this.postPromptRepo.create({ postId, promptId, position: index })),
		);
	}

	private async syncProducts(postId: string, productIds?: string[]): Promise<void> {
		if (productIds === undefined) return;
		await this.postProductRepo.delete({ postId });
		if (!productIds.length) return;
		const unique: string[] = [...new Set(productIds)];
		await this.postProductRepo.save(unique.map((productId: string): PostProduct => this.postProductRepo.create({ postId, productId })));
	}

	private mapPostFields(dto: CreatePostDto | UpdatePostDto): Partial<Post> {
		const fields: Partial<Post> = {};
		if (dto.slug !== undefined) fields.slug = dto.slug;
		if (dto.title !== undefined) fields.title = dto.title;
		if (dto.excerpt !== undefined) fields.excerpt = dto.excerpt ?? null;
		if (dto.body !== undefined) fields.body = dto.body ?? '';
		if (dto.cover_image_url !== undefined) fields.coverImageUrl = dto.cover_image_url ?? null;
		if (dto.status !== undefined) fields.status = dto.status;
		if (dto.featured !== undefined) fields.featured = dto.featured;
		if (dto.reading_time_minutes !== undefined) fields.readingTimeMinutes = dto.reading_time_minutes ?? null;
		if (dto.author_id !== undefined) fields.authorId = dto.author_id ?? null;
		if (dto.category_id !== undefined) fields.categoryId = dto.category_id ?? null;
		if (dto.seo_title !== undefined) fields.seoTitle = dto.seo_title ?? null;
		if (dto.seo_description !== undefined) fields.seoDescription = dto.seo_description ?? null;
		if (dto.canonical_url !== undefined) fields.canonicalUrl = dto.canonical_url ?? null;
		if (dto.og_image_url !== undefined) fields.ogImageUrl = dto.og_image_url ?? null;
		if (dto.seo_status !== undefined) fields.seoStatus = dto.seo_status;
		if (dto.seo_index !== undefined) fields.seoIndex = dto.seo_index;
		if (dto.schema_type !== undefined) fields.schemaType = dto.schema_type;
		if (dto.focus_keyword !== undefined) fields.focusKeyword = dto.focus_keyword ?? null;
		if (dto.faq_items !== undefined) fields.faqItems = dto.faq_items ?? null;
		if (dto.related_post_ids !== undefined) fields.relatedPostIds = dto.related_post_ids ?? null;
		if (dto.modified_at !== undefined) fields.modifiedAt = dto.modified_at ? new Date(dto.modified_at) : null;
		if (dto.keywords !== undefined) fields.keywords = dto.keywords ?? null;
		if (dto.metadata !== undefined) fields.metadata = dto.metadata ?? null;
		if (dto.internal_links !== undefined) fields.internalLinks = dto.internal_links ?? null;
		if (dto.published_at !== undefined) fields.publishedAt = dto.published_at ? new Date(dto.published_at) : null;
		return fields;
	}
}
