import { EventMetadata } from './event-metadata.dto';

export interface SubscriptionTerminatedEventDto {
	subscription_id: string;
	customer_id: string;
	status: string;
	canceled_at?: number;
	price_id?: string;
	timestamp?: string;
	metadata?: EventMetadata;
}
