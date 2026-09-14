import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';
import { Prompts } from './prompts.entity';
import { User } from '../../users/entities/users.entity';

@Entity('prompt_comments')
@Index('idx_prompt_comments_prompt_id', ['prompt'])
@Index('idx_prompt_comments_user_id', ['user'])
export class PromptComments {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Prompts, (prompt: Prompts) => prompt.comments, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'prompt_id' })
	prompt: Prompts;

	@Column({ type: 'uuid', name: 'user_id', nullable: true })
	userId: string | null;

	@ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
	@JoinColumn({ name: 'user_id' })
	user: User | null;

	@Column({ type: 'text' })
	text: string;

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date;
}
