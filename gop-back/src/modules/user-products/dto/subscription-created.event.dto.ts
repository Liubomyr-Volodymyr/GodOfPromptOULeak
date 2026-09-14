import { EventMetadata } from './event-metadata.dto';

export interface SubscriptionCreatedEventDto {
	subscription_id: string;
	payment_intent?: string;
	customer_id: string;
	status: string;
	current_period_start: number;
	current_period_end: number;
	product_id?: string;
	product_slug?: string;
	price_id?: string;
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
