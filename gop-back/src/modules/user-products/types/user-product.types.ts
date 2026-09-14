export type StripeSubscriptionStatus = 'active' | 'past_due' | 'trialing' | 'cancelled' | 'deleted' | 'terminated';

export interface ProductData {
	id: string;
	name: string;
	notion_product_access_url?: string | null;
	image_link?: string | null;
}
