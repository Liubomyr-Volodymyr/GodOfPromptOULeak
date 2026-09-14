import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Tag } from './entities/tag.entity';
import { PostTag } from './entities/post-tag.entity';
import { PostAudienceType } from './entities/post-audience-type.entity';
import { PostTool } from './entities/post-tool.entity';
import { PostPrompt } from './entities/post-prompt.entity';
import { PostProduct } from './entities/post-product.entity';
import { Redirect } from './entities/redirect.entity';
import { Author } from '../library/entities/authors.entity';
import { AudienceType } from '../library/entities/audience-type.entity';
import { Tool } from '../library/entities/tools.entity';
import { Categories } from '../library/entities/categories.entity';
import { Prompts } from '../library/entities/prompts.entity';
import { Products } from '../user-products/entities/products.entity';
import { BlogService } from './services/blog.service';
import { BlogCatalogService } from './services/blog-catalog.service';
import { BlogImportService } from './services/blog-import.service';
import { BlogController } from './controllers/blog.controller';
import { DevBlogController } from './controllers/dev-blog.controller';
import { AdminBlogController } from './controllers/admin-blog.controller';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Post,
			Tag,
			PostTag,
			PostAudienceType,
			PostTool,
			PostPrompt,
			PostProduct,
			Redirect,
			Author,
			AudienceType,
			Tool,
			Categories,
			Prompts,
			Products,
		]),
	],
	controllers: [BlogController, DevBlogController, AdminBlogController],
	providers: [BlogService, BlogCatalogService, BlogImportService],
	exports: [BlogService, BlogCatalogService, BlogImportService],
})
export class BlogModule {}
