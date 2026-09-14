import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

export enum SeoStatusEnum {
	PENDING = 'pending',
	OPTIMISED = 'optimised',
	NEEDS_REVIEW = 'needs_review',
	NOINDEX = 'noindex',
}

@Entity('categories')
export class Categories {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'timestamp', name: 'created_at', nullable: true })
	createdAt: Date;

	@Column({ type: 'timestamp', name: 'updated_at', nullable: true })
	updatedAt: Date;

	@Column({ type: 'varchar', nullable: true })
	name: string;

	@Column({ type: 'varchar', nullable: true })
	slug: string;

	@Column({ type: 'varchar', nullable: true })
	description: string;

	@ManyToOne(() => Categories, (cat) => cat.children, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'parent_id' })
	parent: Categories;

	@OneToMany(() => Categories, (cat) => cat.parent)
	children: Categories[];

	@Column({ type: 'varchar', name: 'meta_title', nullable: true })
	metaTitle: string | null;

	@Column({ type: 'text', name: 'meta_description', nullable: true })
	metaDescription: string | null;

	@Column({ type: 'text', name: 'seo_body_html', nullable: true })
	seoBodyHtml: string | null;

	@Column({ type: 'varchar', name: 'og_image_url', nullable: true })
	ogImageUrl: string | null;

	@Column({ type: 'varchar', name: 'canonical_url', nullable: true })
	canonicalUrl: string | null;

	@Column({ type: 'enum', enum: SeoStatusEnum, name: 'seo_status', default: SeoStatusEnum.PENDING })
	seoStatus: SeoStatusEnum;

	@Column({ type: 'int', name: 'sort_order', default: 0 })
	sortOrder: number;
}
