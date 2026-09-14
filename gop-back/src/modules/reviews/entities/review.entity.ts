import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export interface IReviewContent {
	title: string;
	description: string;
}

export interface IReviewUser {
	name: string;
	avatar_url: string;
}

@Entity('reviews')
export class Review {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'jsonb' })
	review: IReviewContent;

	@Column({ type: 'jsonb' })
	user: IReviewUser;

	@Column({ type: 'int', name: 'stars_amount' })
	stars_amount: number;

	@Column({ type: 'timestamptz', name: 'created_at', default: () => 'now()' })
	createdAt: Date;

	@Column({ type: 'timestamptz', name: 'updated_at', default: () => 'now()' })
	updatedAt: Date;
}
