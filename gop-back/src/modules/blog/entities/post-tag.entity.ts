import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Post } from './post.entity';
import { Tag } from './tag.entity';

@Entity('blog_post_tags')
export class PostTag {
	@PrimaryColumn({ type: 'uuid', name: 'post_id' })
	postId: string;

	@PrimaryColumn({ type: 'int', name: 'tag_id' })
	tagId: number;

	@ManyToOne(() => Post, (p) => p.tagRelations, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'post_id' })
	post: Post;

	@ManyToOne(() => Tag, (t) => t.postRelations, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'tag_id' })
	tag: Tag;
}
