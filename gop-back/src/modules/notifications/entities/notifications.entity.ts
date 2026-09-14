import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('notifications')
@Index(['userId', 'createdAt'])
@Index(['segmentId'])
export class Notification {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid', name: 'user_id', nullable: true })
	userId: string | null;

	@Column({ type: 'uuid', name: 'segment_id', nullable: true })
	segmentId: string | null;

	@Column({ type: 'varchar' })
	title: string;

	@Column({ type: 'text', nullable: true })
	description: string | null;

	@Column({ type: 'varchar', nullable: true })
	image: string | null;

	@Column({ type: 'varchar', nullable: true })
	author: string | null;

	@Column({ type: 'boolean', name: 'is_read', default: false })
	isRead: boolean;

	@Column({ type: 'timestamptz', name: 'read_at', nullable: true })
	readAt: Date | null;

	@CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
	createdAt: Date;
}
