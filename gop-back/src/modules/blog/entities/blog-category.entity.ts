import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';

export enum SeoStatusEnum {
	PENDING = 'pending',
	OPTIMISED = 'optimised',
	NEEDS_REVIEW = 'needs_review',
	NOINDEX = 'noindex',
}

@Entity('blog_categories')
export class BlogCategory {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', nullable: false, unique: true })
	slug: string;

	@Column({ type: 'varchar', nullable: false })
	name: string;

	@Column({ type: 'text', nullable: true })
	description: string | null;

	@Column({ type: 'uuid', name: 'parent_id', nullable: true })
	parentId: string | null;

	@ManyToOne(() => BlogCategory, (bc) => bc.children, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'parent_id' })
	@Index('IDX_blog_categories_parent')
	parent: BlogCategory | null;

	@OneToMany(() => BlogCategory, (bc) => bc.parent)
	children: BlogCategory[];

	@Column({ type: 'varchar', name: 'meta_title', nullable: true })
	metaTitle: string | null;

	@Column({ type: 'text', name: 'meta_description', nullable: true })
	metaDescription: string | null;

	@Column({ type: 'varchar', name: 'canonical_url', nullable: true })
	canonicalUrl: string | null;

	@Column({ type: 'varchar', name: 'og_image_url', nullable: true })
	ogImageUrl: string | null;

	@Column({ type: 'text', name: 'seo_body_html', nullable: true })
	seoBodyHtml: string | null;

	@Column({ type: 'enum', enum: SeoStatusEnum, name: 'seo_status', default: SeoStatusEnum.PENDING })
	seoStatus: SeoStatusEnum;

	@Column({ type: 'int', name: 'sort_order', default: 0 })
	sortOrder: number;

	@Column({ type: 'timestamp', name: 'created_at', default: () => 'now()' })
	createdAt: Date;

	@Column({ type: 'timestamp', name: 'updated_at', default: () => 'now()' })
	updatedAt: Date;
}
