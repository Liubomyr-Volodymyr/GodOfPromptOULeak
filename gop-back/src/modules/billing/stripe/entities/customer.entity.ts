import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('customers', { synchronize: false })
export class CustomerEntity {
	@PrimaryGeneratedColumn({ name: 'customer_id' })
	customer_id: number;

	@Column({ type: 'varchar', nullable: false, unique: true })
	email: string;

	@Column({ type: 'varchar', nullable: false, unique: true })
	stripe_customer_id: string;

	@Column({ type: 'boolean', nullable: false, default: false })
	card_verified: boolean;

	@Column({ type: 'int', nullable: false, default: 0 })
	requests_count: number;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	date_created: Date;
}
