import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BlogService } from '../services/blog.service';
import { PostsQueryDto } from '../dto/posts-query.dto';
import { IPostsListResponse } from '../interfaces/blog.interface';
import { IBlog } from '../interfaces/blog-post-response.interface';
import { Tag } from '../entities/tag.entity';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
	constructor(private readonly blogService: BlogService) {}

	@Get('posts')
	getPosts(@Query() dto: PostsQueryDto): Promise<IPostsListResponse> {
		return this.blogService.findAll(dto);
	}

	@Get('tags')
	getTags(): Promise<Tag[]> {
		return this.blogService.getTags();
	}

	@Get('posts/:slug')
	getPost(@Param('slug') slug: string): Promise<IBlog> {
		return this.blogService.findBySlug(slug);
	}
}
