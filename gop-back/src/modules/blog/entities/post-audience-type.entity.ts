import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Post } from './post.entity';
import { AudienceType } from '../../library/entities/audience-type.entity';

@Entity('blog_post_audiences')
export class PostAudienceType {
	@PrimaryColumn({ type: 'uuid', name: 'post_id' })
	postId: string;

	@PrimaryColumn({ type: 'int', name: 'audience_id' })
	audienceId: number;

	@ManyToOne(() => Post, (post: Post) => post.audienceTypeRelations, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'post_id' })
	post: Post;

	@ManyToOne(() => AudienceType, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'audience_id' })
	audienceType: AudienceType;
}
