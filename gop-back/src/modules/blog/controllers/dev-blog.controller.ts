import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	ParseUUIDPipe,
	Patch,
	Post as HttpPost,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DevOnlyGuard } from '../../../common/guards/dev-only.guard';
import { BlogCatalogService } from '../services/blog-catalog.service';
import { BlogImportService } from '../services/blog-import.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { ImportPostsDto } from '../dto/import-posts.dto';
import { DevPostsQueryDto } from '../dto/dev-posts-query.dto';
import { CreateTagDto, UpdateTagDto } from '../dto/tag.dto';
import { Post } from '../entities/post.entity';
import { Tag } from '../entities/tag.entity';
import { IDevPostsPage, IImportSummary, IPostsStats } from '../interfaces/import.interface';

@ApiTags('Dev Catalog')
@Controller('dev/catalog')
@UseGuards(DevOnlyGuard)
export class DevBlogController {
	constructor(
		private readonly blogCatalogService: BlogCatalogService,
		private readonly blogImportService: BlogImportService,
	) {}

	@HttpPost('posts/import')
	importPosts(@Body() dto: ImportPostsDto): Promise<IImportSummary> {
		return this.blogImportService.importPosts(dto);
	}

	@Get('posts/stats')
	getStats(): Promise<IPostsStats> {
		return this.blogImportService.getStats();
	}

	@Get('posts')
	listPosts(@Query() query: DevPostsQueryDto): Promise<IDevPostsPage> {
		return this.blogImportService.listPosts(query.limit ?? 100, query.offset ?? 0, query.status);
	}

	@HttpPost('post')
	createPost(@Body() dto: CreatePostDto): Promise<Post> {
		return this.blogCatalogService.createPost(dto);
	}

	@Patch('post/:id')
	updatePost(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePostDto): Promise<Post> {
		return this.blogCatalogService.updatePost(id, dto);
	}

	@Delete('post/:id')
	deletePost(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
		return this.blogCatalogService.deletePost(id);
	}

	@Get('tag')
	listTags(): Promise<Tag[]> {
		return this.blogCatalogService.listTags();
	}

	@HttpPost('tag')
	createTag(@Body() dto: CreateTagDto): Promise<Tag> {
		return this.blogCatalogService.createTag(dto);
	}

	@Patch('tag/:id')
	updateTag(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTagDto): Promise<Tag> {
		return this.blogCatalogService.updateTag(id, dto);
	}

	@Delete('tag/:id')
	deleteTag(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
		return this.blogCatalogService.deleteTag(id);
	}
}
