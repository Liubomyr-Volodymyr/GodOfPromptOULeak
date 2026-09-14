import { EventMetadata } from './event-metadata.dto';

export interface TrialEndedEventDto {
	subscription_id: string;
	customer_id: string;
	status: string;
	trial_end: number;
	current_period_start?: number;
	current_period_end?: number;
	timestamp?: string;
	metadata?: EventMetadata;
}
