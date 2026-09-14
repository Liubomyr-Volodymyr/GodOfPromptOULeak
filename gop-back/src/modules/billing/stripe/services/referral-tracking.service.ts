import { Injectable } from '@nestjs/common';

export interface ReferralData {
	referral_code?: string;
	partner_id?: string;
	campaign_id?: string;
	source?: string;
	utm_source?: string;
	utm_medium?: string;
	utm_campaign?: string;
	utm_term?: string;
	utm_content?: string;
	click_id?: string;
	affiliate_id?: string;
	tolt_referral?: string;
}

@Injectable()
export class ReferralTrackingService {
	/**
	 * Extract referral data from any object with tracking fields
	 */
	extractReferralData(data: any): ReferralData {
		return {
			referral_code: data?.referral_code,
			partner_id: data?.partner_id,
			campaign_id: data?.campaign_id,
			source: data?.source,
			utm_source: data?.utm_source,
			utm_medium: data?.utm_medium,
			utm_campaign: data?.utm_campaign,
			utm_term: data?.utm_term,
			utm_content: data?.utm_content,
			click_id: data?.click_id,
			affiliate_id: data?.affiliate_id,
			tolt_referral: data?.tolt_referral,
		};
	}

	/**
	 * Create metadata object for Stripe API calls
	 */
	createMetadata(referralData: ReferralData): Record<string, string> {
		return {
			...referralData,
			created_at: new Date().toISOString(),
		};
	}
}
