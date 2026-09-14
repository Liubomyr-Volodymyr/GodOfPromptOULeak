import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { Products } from './products.entity';
import { ProductPrices } from './product-prices.entity';

export enum ProductAccessEnum {
	TRIAL = 'trial',
	LIMITED = 'limited',
	FULL = 'full',
}

export enum ProductStatusEnum {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
}

@Entity('user_products')
@Index(['user', 'product'])
@Index(['status'])
@Index(['price'])
export class UserProducts {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;

	@ManyToOne(() => Products, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'product_id' })
	product: Products;

	@ManyToOne(() => ProductPrices, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'price_id' })
	price: ProductPrices;

	@Column({ type: 'enum', name: 'access_type', enum: ProductAccessEnum })
	accessType: ProductAccessEnum;

	@Column({ type: 'enum', enum: ProductStatusEnum, default: ProductStatusEnum.ACTIVE })
	status: ProductStatusEnum;

	@Column({ type: 'varchar', name: 'purchase_utm_source', nullable: true })
	purchaseUtmSource: string;

	@Column({ type: 'varchar', name: 'purchase_utm_medium', nullable: true })
	purchaseUtmMedium: string;

	@Column({ type: 'varchar', name: 'purchase_utm_campaign', nullable: true })
	purchaseUtmCampaign: string;

	@Column({ type: 'varchar', name: 'stripe_one_time_purchase_id', nullable: true })
	stripeOneTimePurchaseId: string;

	@Column({ type: 'varchar', name: 'stripe_subscription_id', nullable: true })
	stripeSubscriptionId: string;

	@Column({ type: 'varchar', name: 'payment_intent', nullable: true })
	paymentIntent: string;

	@Column({ type: 'timestamp', name: 'granted_at', nullable: true })
	grantedAt: Date;

	@Column({ type: 'timestamp', name: 'expires_at', nullable: true })
	expiresAt: Date;

	@CreateDateColumn({ type: 'timestamp', name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
	updatedAt: Date;
}
