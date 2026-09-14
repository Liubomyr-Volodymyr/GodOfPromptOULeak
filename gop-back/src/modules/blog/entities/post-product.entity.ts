import { Entity, ManyToOne, JoinColumn, PrimaryColumn, Column } from 'typeorm';
import { Post } from './post.entity';
import { Products } from '../../user-products/entities/products.entity';

export enum PostProductPlacementEnum {
	INLINE = 'inline',
	SIDEBAR = 'sidebar',
	FOOTER = 'footer',
}

@Entity('blog_post_products')
export class PostProduct {
	@PrimaryColumn({ type: 'uuid', name: 'post_id' })
	postId: string;

	@PrimaryColumn({ type: 'uuid', name: 'product_id' })
	productId: string;

	@Column({ type: 'text', nullable: true })
	placement: PostProductPlacementEnum | null;

	@ManyToOne(() => Post, (post: Post) => post.productRelations, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'post_id' })
	post: Post;

	@ManyToOne(() => Products, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'product_id' })
	product: Products;
}
