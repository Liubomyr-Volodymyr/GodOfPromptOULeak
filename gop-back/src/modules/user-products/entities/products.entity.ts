import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';
import { ProductOutputType } from './products-output-types.entity';

export enum ProductStatus {
	DRAFT = 'draft',
	PUBLISHED = 'published',
	ARCHIVED = 'archived',
}

export enum ProductType {
	PLAN = 'plan',
	ADDON = 'addon',
	LEAD_MAGENET = 'lead-magnet',
	GUIDE = 'guide',
}

@Entity('products')
export class Products {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar' })
	name: string;

	@Column({ type: 'varchar', nullable: true })
	description: string;

	// reason: guide HTML is heavy; kept out of list payloads and loaded explicitly on the details route
	@Column({ type: 'text', nullable: true, select: false })
	body: string | null;

	@Column({ type: 'enum', enum: ProductType })
	type: ProductType;

	@Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
	status: ProductStatus;

	@Column({ type: 'varchar' })
	slug: string;

	@Column({ type: 'jsonb', nullable: true })
	categories: any;

	@Column({ type: 'varchar', name: 'stripe_product_id', nullable: true })
	stripeProductId: string;

	@Column({ type: 'varchar', name: 'beehiiv_product_delivery_automation_id', nullable: true })
	beehiivProductDeliveryAutomationId: string;

	@ApiHideProperty()
	@OneToMany(() => ProductOutputType, (pot) => pot.product)
	outputTypes: ProductOutputType[];

	@Column({ type: 'varchar', name: 'notion_product_access_url', nullable: true })
	notionProductAccessUrl: string;

	@Column({ type: 'varchar', name: 'icon_url', nullable: true })
	iconUrl: string;

	@Column({ type: 'varchar', name: 'product_tab_image_url', nullable: true })
	productTabImageUrl: string;

	@Column({ type: 'varchar', name: 'opengraph_image_url', nullable: true })
	opengraphImageUrl: string;

	@Column({ type: 'varchar', name: 'instagram_tab_image_url', nullable: true })
	instagramTabImageUrl: string;

	@Column({ type: 'varchar', name: 'twitter_tab_image_url', nullable: true })
	twitterTabImageUrl: string;

	@Column({ type: 'numeric', name: 'full_price', nullable: true })
	fullPrice: number;

	@Column({ type: 'numeric', name: 'lifetime_price', nullable: true })
	lifetimePrice: number;

	@Column({ type: 'numeric', name: 'monthly_price', nullable: true })
	monthlyPrice: number;

	@Column({ type: 'numeric', name: 'annual_price', nullable: true })
	annualPrice: number;

	@Column({ type: 'varchar', name: 'checkout_url', nullable: true })
	checkoutUrl: string;

	@Column({ type: 'varchar', name: 'subscription_url', nullable: true })
	subscriptionUrl: string;

	@Column({ type: 'varchar', name: 'landing_page_url', nullable: true })
	landingPageUrl: string;

	@Column({ type: 'varchar', name: 'success_url', nullable: true })
	successUrl: string;

	@Column({ type: 'varchar', name: 'subscription_success_url', nullable: true })
	subscriptionSuccessUrl: string;

	@Column({ type: 'varchar', name: 'success_cms_url', nullable: true })
	successCmsUrl: string;

	@Column({ type: 'varchar', name: 'prompt_library_url', nullable: true })
	promptLibraryUrl: string;

	@Column({ type: 'varchar', name: 'instagram_giveaway_url', nullable: true })
	instagramGiveawayUrl: string;

	@Column({ type: 'varchar', name: 'notion_link', nullable: true })
	notionLink: string;

	@Column({ type: 'varchar', name: 'external_product_id', nullable: true })
	externalProductId: string;

	@Column({ type: 'varchar', nullable: true })
	llm: string;

	@Column({ type: 'varchar', name: 'subscription_slug', nullable: true })
	subscriptionSlug: string;

	@Column({ type: 'jsonb', nullable: true })
	utm: Record<string, string>;

	@Column({ type: 'jsonb', nullable: true })
	features: string[];

	@CreateDateColumn({ type: 'timestamp', name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp', name: 'updated_at', nullable: true })
	updatedAt: Date;
}
