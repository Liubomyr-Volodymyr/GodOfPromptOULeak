import { EventMetadata } from './event-metadata.dto';

export interface RefundEventDto {
	charge_id?: string;
	amount?: number;
	amount_refunded?: number;
	currency?: string;
	customer_id: string;
	payment_intent_id?: string;
	price_id?: string;
	product_id?: string;
	timestamp?: string;
	metadata?: EventMetadata;
}
