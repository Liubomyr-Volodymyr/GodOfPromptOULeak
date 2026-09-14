import { FindOptionsRelations, Repository, SelectQueryBuilder } from 'typeorm';

import { Post, PostStatusEnum } from '../entities/post.entity';
import { PostsQueryDto, PostSortField, SortOrder } from '../dto/posts-query.dto';

export const POST_DETAIL_RELATIONS: FindOptionsRelations<Post> = {
	author: true,
	category: true,
	tagRelations: { tag: true },
	audienceTypeRelations: { audienceType: true },
	toolRelations: { tool: true },
	promptRelations: { prompt: true },
	productRelations: { product: true },
};

export function createPostsListQuery(repo: Repository<Post>): SelectQueryBuilder<Post> {
	return repo
		.createQueryBuilder('post')
		.leftJoinAndSelect('post.author', 'author')
		.leftJoinAndSelect('post.category', 'category')
		.leftJoinAndSelect('post.tagRelations', 'tagRelations')
		.leftJoinAndSelect('tagRelations.tag', 'tag')
		.leftJoinAndSelect('post.audienceTypeRelations', 'audienceTypeRelations')
		.leftJoinAndSelect('audienceTypeRelations.audienceType', 'audienceType')
		.leftJoinAndSelect('post.toolRelations', 'toolRelations')
		.leftJoinAndSelect('toolRelations.tool', 'tool')
		.leftJoinAndSelect('post.promptRelations', 'promptRelations')
		.leftJoinAndSelect('promptRelations.prompt', 'prompt')
		.leftJoinAndSelect('post.productRelations', 'productRelations')
		.leftJoinAndSelect('productRelations.product', 'product');
}

export function applyPostsFilters(qb: SelectQueryBuilder<Post>, dto: PostsQueryDto): void {
	// Public feed only ever exposes published posts
	qb.andWhere('post.status = :_status', { _status: PostStatusEnum.PUBLISHED });

	if (dto.categorySlug) {
		qb.andWhere('category.slug = :categorySlug', { categorySlug: dto.categorySlug });
	}

	if (dto.featured !== undefined) {
		qb.andWhere('post.featured = :featured', { featured: dto.featured === 'true' });
	}

	if (dto.search) {
		qb.andWhere(
			`(
				post.title ILIKE :search
				OR post.excerpt ILIKE :search
			)`,
			{ search: `%${dto.search}%` },
		);
	}

	if (dto.tagSlug) {
		qb.innerJoin('post.tagRelations', '_pt').innerJoin('_pt.tag', '_t').andWhere('_t.slug = :tagSlug', { tagSlug: dto.tagSlug });
	}

	if (dto.audienceTypeSlug) {
		qb.innerJoin('post.audienceTypeRelations', '_pat')
			.innerJoin('_pat.audienceType', '_at')
			.andWhere('_at.slug = :atSlug', { atSlug: dto.audienceTypeSlug });
	}

	if (dto.toolSlug) {
		qb.innerJoin('post.toolRelations', '_ptool')
			.innerJoin('_ptool.tool', '_tool')
			.andWhere('_tool.slug = :toolSlug', { toolSlug: dto.toolSlug });
	}
}

export function applyPostsSort(qb: SelectQueryBuilder<Post>, dto: PostsQueryDto): void {
	const sortMap: Record<PostSortField, string> = {
		[PostSortField.PUBLISHED_AT]: 'post.publishedAt',
		[PostSortField.CREATED_AT]: 'post.createdAt',
		[PostSortField.TITLE]: 'post.title',
	};

	const sortField: string = sortMap[dto?.sort] || 'post.publishedAt';
	const order: 'ASC' | 'DESC' = dto.order === SortOrder.ASC ? 'ASC' : 'DESC';

	qb.orderBy(sortField, order);
}

export function applyPostsPagination(qb: SelectQueryBuilder<Post>, dto: PostsQueryDto): void {
	qb.skip(dto.offset || 0);
	qb.take(dto.limit || 24);
}
