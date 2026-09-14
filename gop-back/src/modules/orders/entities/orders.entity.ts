import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { Products } from '../../user-products/entities/products.entity';
import { ProductPrices } from '../../user-products/entities/product-prices.entity';

export enum OrderTypeEnum {
	ONE_TIME = 'one_time',
	SUBSCRIPTION = 'subscription',
	RENEWAL = 'renewal',
}

export enum OrderStatusEnum {
	PAID = 'paid',
	REFUNDED = 'refunded',
	PARTIALLY_REFUNDED = 'partially_refunded',
}

// pg returns numeric as string; without the transformer every consumer would have to Number() it
const numericToNumber = {
	to: (value: number): number => value,
	from: (value: string | null): number => (value === null ? 0 : Number(value)),
};

@Entity('orders')
@Index(['user'])
@Index(['status'])
@Index(['type'])
@Index(['paidAt'])
export class Orders {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;

	@ManyToOne(() => Products, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'product_id' })
	product: Products | null;

	@ManyToOne(() => ProductPrices, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'price_id' })
	price: ProductPrices | null;

	@Column({ type: 'numeric', precision: 12, scale: 2, transformer: numericToNumber })
	amount: number;

	@Column({ type: 'numeric', name: 'refunded_amount', precision: 12, scale: 2, default: 0, transformer: numericToNumber })
	refundedAmount: number;

	@Column({ type: 'varchar', length: 10 })
	currency: string;

	@Column({ type: 'enum', enum: OrderTypeEnum })
	type: OrderTypeEnum;

	@Column({ type: 'enum', enum: OrderStatusEnum, default: OrderStatusEnum.PAID })
	status: OrderStatusEnum;

	@Column({ type: 'varchar', name: 'stripe_price_id', nullable: true })
	stripePriceId: string | null;

	@Column({ type: 'varchar', name: 'stripe_payment_intent', nullable: true })
	stripePaymentIntent: string | null;

	@Column({ type: 'varchar', name: 'stripe_invoice_id', nullable: true })
	stripeInvoiceId: string | null;

	@Column({ type: 'varchar', name: 'stripe_subscription_id', nullable: true })
	stripeSubscriptionId: string | null;

	@Column({ type: 'varchar', name: 'stripe_customer_id', nullable: true })
	stripeCustomerId: string | null;

	@Column({ type: 'varchar', name: 'purchase_utm_source', nullable: true })
	purchaseUtmSource: string | null;

	@Column({ type: 'varchar', name: 'purchase_utm_medium', nullable: true })
	purchaseUtmMedium: string | null;

	@Column({ type: 'varchar', name: 'purchase_utm_campaign', nullable: true })
	purchaseUtmCampaign: string | null;

	@Column({ type: 'timestamptz', name: 'paid_at' })
	paidAt: Date;

	@Column({ type: 'timestamptz', name: 'refunded_at', nullable: true })
	refundedAt: Date | null;

	@CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
	updatedAt: Date;
}
