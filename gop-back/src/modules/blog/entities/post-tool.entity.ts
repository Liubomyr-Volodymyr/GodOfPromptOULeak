import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Post } from './post.entity';
import { Tool } from '../../library/entities/tools.entity';

@Entity('blog_post_tools')
export class PostTool {
	@PrimaryColumn({ type: 'uuid', name: 'post_id' })
	postId: string;

	@PrimaryColumn({ type: 'int', name: 'tool_id' })
	toolId: number;

	@ManyToOne(() => Post, (p) => p.toolRelations, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'post_id' })
	post: Post;

	@ManyToOne(() => Tool, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'tool_id' })
	tool: Tool;
}
