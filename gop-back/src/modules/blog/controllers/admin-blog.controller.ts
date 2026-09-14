import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post as HttpPost, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { BlogCatalogService } from '../services/blog-catalog.service';
import { AdminPostsQueryDto } from '../dto/admin-posts-query.dto';
import { AdminPostsPageDto, AuthorStatsDto } from '../dto/admin-blog.dto';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { Post } from '../entities/post.entity';
import { AdminJwtGuard } from '../../../admin/modules/auth/guards/admin-jwt.guard';
import { RolesGuard } from '../../../admin/modules/auth/guards/roles.guard';
import { AdminRole, Roles } from '../../../admin/common/decorators/roles.decorator';

@ApiTags('Blog Admin')
@ApiBearerAuth('access_token')
@Controller('blog/admin')
@Roles(AdminRole.Manager, AdminRole.Admin, AdminRole.SuperAdmin)
@UseGuards(AdminJwtGuard, RolesGuard)
export class AdminBlogController {
	constructor(private readonly blogCatalogService: BlogCatalogService) {}

	@Get('posts')
	@ApiOperation({ summary: 'List posts of any status with author and category (admin)' })
	@ApiOkResponse({ type: AdminPostsPageDto })
	getPosts(@Query() dto: AdminPostsQueryDto): Promise<AdminPostsPageDto> {
		return this.blogCatalogService.listPostsForAdmin(dto);
	}

	@Get('authors')
	@ApiOperation({ summary: 'List authors with post counts and last publish date (admin)' })
	@ApiOkResponse({ type: [AuthorStatsDto] })
	getAuthors(): Promise<AuthorStatsDto[]> {
		return this.blogCatalogService.listAuthorStats();
	}

	@Get('posts/:id')
	@ApiOperation({ summary: 'Get single post with all fields and relations (admin)' })
	getPost(@Param('id', ParseUUIDPipe) id: string): Promise<Post> {
		return this.blogCatalogService.getPostForAdmin(id);
	}

	@HttpPost('posts')
	@ApiOperation({ summary: 'Create post (admin)' })
	createPost(@Body() dto: CreatePostDto): Promise<Post> {
		return this.blogCatalogService.createPost(dto);
	}

	@Patch('posts/:id')
	@ApiOperation({ summary: 'Update post fields (admin)' })
	updatePost(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePostDto): Promise<Post> {
		return this.blogCatalogService.updatePost(id, dto);
	}

	@Delete('posts/:id')
	@ApiOperation({ summary: 'Delete post (admin)' })
	deletePost(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
		return this.blogCatalogService.deletePost(id);
	}
}
