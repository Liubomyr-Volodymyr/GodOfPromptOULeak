import { PostStatusEnum } from '../entities/post.entity';

export class PostsListMetaDto {
	total: number;
	limit?: number;
	offset?: number;
}

export class AdminPostListItemDto {
	id: string;
	slug: string;
	title: string;
	status: PostStatusEnum;
	featured: boolean;
	authorId: number | null;
	authorName: string | null;
	categoryName: string | null;
	coverImageUrl: string | null;
	ogImageUrl: string | null;
	publishedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export class AdminPostsPageDto {
	data: AdminPostListItemDto[];
	meta: PostsListMetaDto;
}

export class AuthorStatsDto {
	id: number;
	name: string;
	postsCount: number;
	lastPublishedAt: Date | null;
}
