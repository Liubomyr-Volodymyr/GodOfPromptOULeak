import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('blog_redirects')
export class Redirect {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'text', name: 'from_path', nullable: false, unique: true })
	fromPath: string;

	@Column({ type: 'text', name: 'to_path', nullable: false })
	toPath: string;

	@Column({ type: 'smallint', default: 301 })
	status: number;

	@Column({ type: 'timestamptz', name: 'created_at', default: () => 'now()' })
	createdAt: Date;
}
