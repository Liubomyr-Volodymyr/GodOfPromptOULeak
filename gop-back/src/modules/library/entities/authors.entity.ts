import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('authors')
export class Author {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', nullable: false })
	name: string;

	@Column({ type: 'varchar', nullable: true, unique: true })
	slug: string | null;

	@Column({ type: 'text', nullable: true })
	bio: string | null;

	@Column({ type: 'varchar', nullable: true })
	role: string | null;

	@Column({ type: 'varchar', name: 'avatar_url', nullable: true })
	avatarUrl: string | null;

	@Column({ type: 'varchar', name: 'twitter_url', nullable: true })
	twitterUrl: string | null;

	@Column({ type: 'varchar', name: 'linkedin_url', nullable: true })
	linkedinUrl: string | null;

	@Column({ type: 'varchar', name: 'website_url', nullable: true })
	websiteUrl: string | null;

	@Column({ type: 'varchar', name: 'meta_title', nullable: true })
	metaTitle: string | null;

	@Column({ type: 'text', name: 'meta_description', nullable: true })
	metaDescription: string | null;

	@Column({ type: 'varchar', name: 'og_image_url', nullable: true })
	ogImageUrl: string | null;
}
