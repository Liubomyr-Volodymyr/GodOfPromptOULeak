import { Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn, Index, CreateDateColumn, Column } from 'typeorm';
import { Prompts } from './prompts.entity';
import { User } from '../../users/entities/users.entity';

@Entity('prompt_likes')
@Index('idx_prompt_likes_prompt_id', ['prompt'])
@Index('idx_prompt_likes_user_id', ['user'])
@Index('uq_prompt_likes_prompt_user', ['prompt', 'user'], { unique: true })
export class PromptLikes {
	@PrimaryGeneratedColumn()
	id: bigint;

	@ManyToOne(() => Prompts, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'prompt_id' })
	prompt: Prompts;

	@Column({ type: 'uuid', name: 'user_id', nullable: true })
	userId: string | null;

	@ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
	@JoinColumn({ name: 'user_id' })
	user: User | null;

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;
}
