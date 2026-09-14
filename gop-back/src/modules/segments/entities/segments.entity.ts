import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('segments')
export class Segment {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar' })
	name: string;

	@Column({ type: 'varchar', name: 'stripe_price_id', unique: true, nullable: true })
	stripePriceId: string;
}
