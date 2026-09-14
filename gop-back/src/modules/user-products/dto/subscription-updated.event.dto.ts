import { EventMetadata } from './event-metadata.dto';

export interface SubscriptionUpdatedEventDto {
	subscription_id: string;
	customer_id: string;
	status: string;
	current_period_start?: number;
	current_period_end?: number;
	canceled_at?: number;
	product_id?: string;
	price_id?: string;
	product_slug?: string;
	utm_source?: string;
	utm_medium?: string;
	utm_campaign?: string;
	utm_term?: string;
	utm_content?: string;
	referral_code?: string;
	partner_id?: string;
	campaign_id?: string;
	source?: string;
	click_id?: string;
	affiliate_id?: string;
	timestamp?: string;
	metadata?: EventMetadata;
}
