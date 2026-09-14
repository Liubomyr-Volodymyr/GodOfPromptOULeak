import { EventMetadata } from './event-metadata.dto';

export interface PurchaseCompletedEventDto {
	payment_intent_id: string;
	session_id?: string;
	customer_id: string;
	status: string;
	amount?: number;
	currency?: string;
	user_id?: string;
	email?: string;
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
