import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Products } from './products.entity';

export enum PriceType {
	ONE_TIME = 'one_time',
	RECURRING = 'recurring',
}

@Entity('product_prices')
@Index(['product'])
@Index(['stripePriceId'], { unique: true })
export class ProductPrices {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => Products, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'product_id' })
	product: Products;

	@Column({ type: 'numeric' })
	price: number;

	@Column({ type: 'varchar', length: 10 })
	currency: string;

	@Column({ type: 'enum', name: 'price_type', enum: PriceType })
	priceType: PriceType;

	@Column({ type: 'varchar', name: 'price_period', nullable: true })
	pricePeriod: string;

	@Column({ type: 'varchar', name: 'stripe_price_id', unique: true })
	stripePriceId: string;

	@Column({ type: 'varchar', name: 'product_price_name' })
	productPriceName: string;
}
