import { ReferralData } from '../services/referral-tracking.service';

export interface ProductPriceIds {
	productId?: string;
	priceId?: string;
}

export function extractProductAndPriceIds(lineItems: any): ProductPriceIds {
	if (!lineItems?.data || lineItems.data.length === 0) {
		return {};
	}

	const firstItem = lineItems.data[0];
	const priceId = firstItem.price?.id || firstItem.price;
	let productId: string | undefined;

	if (firstItem.price?.product) {
		productId = typeof firstItem.price.product === 'string' ? firstItem.price.product : firstItem.price.product?.id;
	}

	return { productId, priceId };
}

export function enrichMetadataWithReferralData(metadata: Record<string, string>, referralData: ReferralData): Record<string, string> {
	const enriched: Record<string, string> = { ...metadata };

	if (metadata.user_id) enriched.user_id = metadata.user_id;
	if (metadata.email) enriched.email = metadata.email;

	if (referralData.referral_code) enriched.referral_code = referralData.referral_code;
	if (referralData.partner_id) enriched.partner_id = referralData.partner_id;
	if (referralData.campaign_id) enriched.campaign_id = referralData.campaign_id;
	if (referralData.source) enriched.source = referralData.source;
	if (referralData.click_id) enriched.click_id = referralData.click_id;
	if (referralData.affiliate_id) enriched.affiliate_id = referralData.affiliate_id;
	if (referralData.utm_source) enriched.utm_source = referralData.utm_source;
	if (referralData.utm_medium) enriched.utm_medium = referralData.utm_medium;
	if (referralData.utm_campaign) enriched.utm_campaign = referralData.utm_campaign;
	if (referralData.utm_term) enriched.utm_term = referralData.utm_term;
	if (referralData.utm_content) enriched.utm_content = referralData.utm_content;
	if (referralData.tolt_referral) enriched.tolt_referral = referralData.tolt_referral;

	return enriched;
}

export function addReferralFieldsToEventData(eventData: any, referralData: ReferralData): void {
	if (referralData.referral_code) eventData.referral_code = referralData.referral_code;
	if (referralData.partner_id) eventData.partner_id = referralData.partner_id;
	if (referralData.campaign_id) eventData.campaign_id = referralData.campaign_id;
	if (referralData.source) eventData.source = referralData.source;
	if (referralData.click_id) eventData.click_id = referralData.click_id;
	if (referralData.affiliate_id) eventData.affiliate_id = referralData.affiliate_id;
	if (referralData.utm_source) eventData.utm_source = referralData.utm_source;
	if (referralData.utm_medium) eventData.utm_medium = referralData.utm_medium;
	if (referralData.utm_campaign) eventData.utm_campaign = referralData.utm_campaign;
	if (referralData.utm_term) eventData.utm_term = referralData.utm_term;
	if (referralData.utm_content) eventData.utm_content = referralData.utm_content;
	if (referralData.tolt_referral) eventData.tolt_referral = referralData.tolt_referral;
}
