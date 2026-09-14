import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';
import { UserEmails } from './user-emails.entity';
import { UserSegment } from '../../segments/entities/user-segments.entity';
import { UserProducts } from '../../user-products/entities/user-products.entity';

@Entity('users')
export class User {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', name: 'first_name', nullable: true })
	firstName: string;

	@Column({ type: 'varchar', name: 'last_name', nullable: true })
	lastName: string;

	@Column({ type: 'varchar', name: 'full_name', nullable: true })
	fullName: string;

	@Column({ type: 'varchar', name: 'first_utm_source', nullable: true })
	firstUtmSource: string;

	@Column({ type: 'varchar', name: 'first_utm_medium', nullable: true })
	firstUtmMedium: string;

	@Column({ type: 'varchar', name: 'first_utm_campaign', nullable: true })
	firstUtmCampaign: string;

	@Column({ type: 'varchar', name: 'first_utm_content', nullable: true })
	firstUtmContent: string;

	@Column({ type: 'varchar', name: 'first_utm_term', nullable: true })
	firstUtmTerm: string;

	@Column({ type: 'varchar', name: 'first_purchase_utm', nullable: true })
	firstPurchaseUtm: string;

	@Column({ type: 'varchar', name: 'lead_magnet_slug', nullable: true })
	leadMagnetSlug: string;

	@Column({ type: 'timestamp', name: 'last_purchase', nullable: true })
	lastPurchase: Date;

	@Column({ type: 'timestamp', name: 'first_purchase', nullable: true })
	firstPurchase: Date;

	@Column({ type: 'timestamp', name: 'last_checked_notifications', nullable: true })
	lastCheckedNotifications: Date;

	@Column({ type: 'numeric', nullable: true })
	ltv: number;

	@Column({ type: 'varchar', name: 'stripe_id', nullable: true })
	stripeId: string;

	@Column({ type: 'boolean', name: 'is_verified', nullable: true })
	isVerified: boolean;

	@Column({ type: 'varchar', name: 'current_status', nullable: true })
	currentStatus: string;

	@Column({ type: 'uuid', nullable: true })
	avatar: string;

	@Column({ type: 'varchar', nullable: true })
	email: string;

	@Column({ type: 'varchar', nullable: true })
	phone: string;

	@Column({ type: 'timestamp', name: 'last_login', nullable: true })
	lastLogin: Date;

	@Column({ type: 'boolean', name: 'marketing_emails', nullable: true })
	marketingEmails: boolean;

	@Column({ type: 'varchar', nullable: true })
	password: string;

	@Column({ type: 'boolean', name: 'product_updates', nullable: true })
	productUpdates: boolean;

	@Column({ type: 'varchar', nullable: true })
	country: string;

	@Column({ type: 'varchar', name: 'country_code', nullable: true })
	countryCode: string;

	@Column({ type: 'varchar', nullable: true })
	city: string;

	@Column({ type: 'varchar', nullable: true })
	state: string;

	@Column({ type: 'varchar', name: 'postal_code', nullable: true })
	postalCode: string;

	@Column({ type: 'varchar', name: 'stripe_customer_id', nullable: true })
	stripeCustomerId: string;

	@Column({ type: 'varchar', name: 'beehiv_subscriber_id', nullable: true })
	beehivSubscriberId: string;

	@ApiHideProperty()
	@OneToMany(() => UserProducts, (up) => up.user)
	products: UserProducts[];

	@ApiHideProperty()
	@OneToMany(() => UserEmails, (email) => email.user)
	emails: UserEmails[];

	@ApiHideProperty()
	@OneToMany(() => UserSegment, (us) => us.user)
	segments: UserSegment[];

	@Column({ type: 'timestamp', name: 'created_at', nullable: true })
	createdAt: Date;

	@Column({ type: 'timestamp', name: 'updated_at', nullable: true })
	updatedAt: Date;
}
