import { Entity, ManyToOne, JoinColumn, PrimaryColumn, Column } from 'typeorm';
import { Post } from './post.entity';
import { Prompts } from '../../library/entities/prompts.entity';

@Entity('blog_post_prompts')
export class PostPrompt {
	@PrimaryColumn({ type: 'uuid', name: 'post_id' })
	postId: string;

	@PrimaryColumn({ type: 'uuid', name: 'prompt_id' })
	promptId: string;

	@Column({ type: 'smallint', nullable: true })
	position: number | null;

	@ManyToOne(() => Post, (post: Post) => post.promptRelations, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'post_id' })
	post: Post;

	@ManyToOne(() => Prompts, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'prompt_id' })
	prompt: Prompts;
}
