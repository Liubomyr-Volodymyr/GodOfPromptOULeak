import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { PostTag } from './post-tag.entity';

@Entity('blog_tags')
export class Tag {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', nullable: false })
	name: string;

	@Column({ type: 'varchar', nullable: false, unique: true })
	slug: string;

	@Column({ type: 'boolean', default: true })
	noindex: boolean;

	@OneToMany(() => PostTag, (pt) => pt.tag)
	postRelations: PostTag[];
}
