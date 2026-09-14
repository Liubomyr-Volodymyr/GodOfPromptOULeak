import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Author } from '../../library/entities/authors.entity';
import { Categories, SeoStatusEnum } from '../../library/entities/categories.entity';
import { PostTag } from './post-tag.entity';
import { PostAudienceType } from './post-audience-type.entity';
import { PostTool } from './post-tool.entity';
import { PostPrompt } from './post-prompt.entity';
import { PostProduct } from './post-product.entity';

export enum PostStatusEnum {
	DRAFT = 'draft',
	PUBLISHED = 'published',
	ARCHIVED = 'archived',
}

@Entity('blog_posts')
export class Post {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', nullable: false, unique: true })
	slug: string;

	@Column({ type: 'varchar', nullable: false })
	title: string;

	@Column({ type: 'text', nullable: true })
	excerpt: string | null;

	@Column({ type: 'text', default: '' })
	body: string;

	@Column({ type: 'varchar', name: 'cover_image_url', nullable: true })
	coverImageUrl: string | null;

	@Column({ type: 'enum', enum: PostStatusEnum, default: PostStatusEnum.DRAFT })
	status: PostStatusEnum;

	@Column({ type: 'boolean', default: false })
	featured: boolean;

	@Column({ type: 'boolean', name: 'seo_index', default: true })
	seoIndex: boolean;

	@Column({ type: 'int', name: 'reading_time_minutes', nullable: true })
	readingTimeMinutes: number | null;

	@Column({ type: 'int', name: 'author_id', nullable: true })
	authorId: number | null;

	@ManyToOne(() => Author, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'author_id' })
	author: Author | null;

	@Column({ type: 'int', name: 'category_id', nullable: true })
	categoryId: number | null;

	@ManyToOne(() => Categories, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'category_id' })
	category: Categories | null;

	@Column({ type: 'varchar', name: 'seo_title', nullable: true })
	seoTitle: string | null;

	@Column({ type: 'text', name: 'seo_description', nullable: true })
	seoDescription: string | null;

	@Column({ type: 'varchar', name: 'canonical_url', nullable: true })
	canonicalUrl: string | null;

	@Column({ type: 'varchar', name: 'og_image_url', nullable: true })
	ogImageUrl: string | null;

	@Column({ type: 'enum', enum: SeoStatusEnum, name: 'seo_status', default: SeoStatusEnum.PENDING })
	seoStatus: SeoStatusEnum;

	@Column({ type: 'varchar', name: 'schema_type', default: 'Article' })
	schemaType: string;

	@Column({ type: 'varchar', name: 'focus_keyword', nullable: true })
	focusKeyword: string | null;

	@Column({ type: 'jsonb', name: 'faq_items', nullable: true })
	faqItems: Array<{ question: string; answer: string }> | null;

	@Column({ type: 'jsonb', name: 'internal_links', nullable: true })
	internalLinks: Array<{ anchor: string; url: string }> | null;

	@Column({ type: 'jsonb', name: 'related_post_ids', nullable: true })
	relatedPostIds: string[] | null;

	@Column({ type: 'text', array: true, nullable: true })
	keywords: string[] | null;

	// reason: free-form SEO/analytics bag; shape not fixed at the type level
	@Column({ type: 'jsonb', nullable: true })
	metadata: Record<string, unknown> | null;

	// reason: tsvector value surfaces as a raw string; excluded from default selects
	@Column({ type: 'tsvector', name: 'search_vector', nullable: true, select: false })
	searchVector: string | null;

	@Column({ type: 'timestamp', name: 'published_at', nullable: true })
	publishedAt: Date | null;

	@Column({ type: 'timestamp', name: 'modified_at', nullable: true })
	modifiedAt: Date | null;

	@Column({ type: 'timestamp', name: 'created_at', default: () => 'now()' })
	createdAt: Date;

	@Column({ type: 'timestamp', name: 'updated_at', default: () => 'now()' })
	updatedAt: Date;

	@OneToMany(() => PostTag, (postTag: PostTag) => postTag.post)
	tagRelations: PostTag[];

	@OneToMany(() => PostAudienceType, (postAudienceType: PostAudienceType) => postAudienceType.post)
	audienceTypeRelations: PostAudienceType[];

	@OneToMany(() => PostTool, (postTool: PostTool) => postTool.post)
	toolRelations: PostTool[];

	@OneToMany(() => PostPrompt, (postPrompt: PostPrompt) => postPrompt.post)
	promptRelations: PostPrompt[];

	@OneToMany(() => PostProduct, (postProduct: PostProduct) => postProduct.post)
	productRelations: PostProduct[];
}
