import { Post, PostStatusEnum } from '../entities/post.entity';
import { IBlog, IContentRef, ITaxonomyRef } from '../interfaces/blog-post-response.interface';

const STATUS_MAP: Record<PostStatusEnum, string> = {
	[PostStatusEnum.DRAFT]: 'draft',
	[PostStatusEnum.PUBLISHED]: 'publish',
	[PostStatusEnum.ARCHIVED]: 'archived',
};

function toWpDate(value: Date | null): string | null {
	if (!value) return null;
	return new Date(value).toISOString().slice(0, 19);
}

function buildLink(frontendUrl: string, slug: string): string {
	return `${frontendUrl.replace(/\/+$/, '')}/blog/${slug}/`;
}

export function toBlogResponse(post: Post, frontendUrl: string): IBlog {
	const link: string = post.canonicalUrl ?? buildLink(frontendUrl, post.slug);

	const audience: ITaxonomyRef[] = (post.audienceTypeRelations ?? [])
		.map((relation): ITaxonomyRef | null =>
			relation.audienceType
				? { id: relation.audienceType.id, name: relation.audienceType.name, slug: relation.audienceType.slug }
				: null,
		)
		.filter((item): item is ITaxonomyRef => item !== null);

	const tools: ITaxonomyRef[] = (post.toolRelations ?? [])
		.map((relation): ITaxonomyRef | null =>
			relation.tool ? { id: relation.tool.id, name: relation.tool.name, slug: relation.tool.slug } : null,
		)
		.filter((item): item is ITaxonomyRef => item !== null);

	const prompts: IContentRef[] = (post.promptRelations ?? [])
		.map((relation): IContentRef | null =>
			relation.prompt ? { id: relation.prompt.id, title: relation.prompt.promptName, slug: relation.prompt.slug } : null,
		)
		.filter((item): item is IContentRef => item !== null);

	const products: IContentRef[] = (post.productRelations ?? [])
		.map((relation): IContentRef | null =>
			relation.product ? { id: relation.product.id, title: relation.product.name, slug: relation.product.slug } : null,
		)
		.filter((item): item is IContentRef => item !== null);

	return {
		id: post.id,
		date: toWpDate(post.publishedAt),
		modified: toWpDate(post.updatedAt) ?? toWpDate(post.createdAt) ?? '',
		slug: post.slug,
		status: STATUS_MAP[post.status],
		link,
		title: { rendered: post.title },
		excerpt: { rendered: post.excerpt ?? '' },
		content: { rendered: post.body },
		yoast_head_json: {
			title: post.seoTitle ?? post.title,
			canonical: post.canonicalUrl ?? link,
		},
		audience,
		tools,
		prompts,
		products,
	};
}
