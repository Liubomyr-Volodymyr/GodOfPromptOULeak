import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import { User } from './users.entity';

@Entity('user_emails')
@Index(['email'], { unique: true })
export class UserEmails {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', nullable: true })
	email: string;

	@ManyToOne(() => User, (user) => user.emails, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;
}
