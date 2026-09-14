import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { Post, PostStatusEnum } from '../entities/post.entity';
import { Tag } from '../entities/tag.entity';
import { PostsQueryDto } from '../dto/posts-query.dto';
import { IPostsListResponse } from '../interfaces/blog.interface';
import { IBlog } from '../interfaces/blog-post-response.interface';
import {
	POST_DETAIL_RELATIONS,
	applyPostsFilters,
	applyPostsPagination,
	applyPostsSort,
	createPostsListQuery,
} from '../helpers/posts-query.builder';
import { toBlogResponse } from '../helpers/blog-post.mapper';
import { toHttpError } from '../../../common/helpers/http-error.helper';
import { CONFIG } from '../../../config/enums';

@Injectable()
export class BlogService {
	private readonly frontendUrl: string;

	constructor(
		@InjectRepository(Post)
		private readonly postsRepo: Repository<Post>,
		@InjectRepository(Tag)
		private readonly tagsRepo: Repository<Tag>,
		private readonly configService: ConfigService,
	) {
		this.frontendUrl = this.configService.get(CONFIG.FRONTEND_URL);
	}

	async findAll(dto: PostsQueryDto): Promise<IPostsListResponse> {
		try {
			const qb: SelectQueryBuilder<Post> = createPostsListQuery(this.postsRepo);

			applyPostsFilters(qb, dto);
			applyPostsSort(qb, dto);
			applyPostsPagination(qb, dto);

			const [items, total]: [Post[], number] = await qb.getManyAndCount();

			return {
				data: items.map((post: Post): IBlog => toBlogResponse(post, this.frontendUrl)),
				meta: {
					total,
					limit: dto.limit,
					offset: dto.offset,
				},
			};
		} catch (error) {
			throw toHttpError(error, 'Failed to fetch posts', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async findBySlug(slug: string): Promise<IBlog> {
		try {
			const post: Post | null = await this.postsRepo.findOne({
				where: { slug, status: PostStatusEnum.PUBLISHED },
				relations: POST_DETAIL_RELATIONS,
			});

			if (!post) throw new NotFoundException('Post not found');

			return toBlogResponse(post, this.frontendUrl);
		} catch (error) {
			if (error instanceof NotFoundException) throw error;
			throw toHttpError(error, 'Failed to fetch post', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getTags(): Promise<Tag[]> {
		try {
			return await this.tagsRepo.find({ order: { name: 'ASC' } });
		} catch (error) {
			throw toHttpError(error, 'Failed to fetch tags', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
