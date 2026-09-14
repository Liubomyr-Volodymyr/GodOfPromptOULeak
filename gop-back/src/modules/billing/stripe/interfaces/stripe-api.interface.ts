// Stripe API Interfaces for checkout sessions and metadata tracking

export interface StripeCheckoutSession {
	id: string;
	object: 'checkout.session';
	amount_total: number;
	amount_subtotal?: number;
	currency: string;
	customer_email?: string;
	customer_name?: string;
	metadata: Record<string, string>;
	payment_status: 'paid' | 'unpaid' | 'no_payment_required';
	status: 'open' | 'complete' | 'expired';
	success_url: string;
	cancel_url: string;
	url?: string;
	created: number;
	expires_at: number;
	total_details?: {
		amount_discount: number;
		amount_shipping: number;
		amount_tax: number;
	};
	discounts?: Array<{
		coupon?: StripeCoupon;
		discount?: string;
		promotion_code?: string;
	}>;
}

export interface CreateCheckoutSessionRequest {
	success_url: string;
	cancel_url: string;
	line_items: Array<{
		price_data?: {
			currency: string;
			product_data: {
				name: string;
				description?: string;
			};
			unit_amount: number;
		};
		price?: string;
		quantity: number;
	}>;
	mode: 'payment' | 'subscription' | 'setup';
	customer?: string;
	customer_email?: string;
	customer_name?: string;
	metadata?: Record<string, string>;
	referral_code?: string;
	partner_id?: string;
	expand?: string[];
	discounts?: Array<{
		coupon?: string; // Coupon ID
		promotion_code?: string; // Promotion Code ID
	}>;
	allow_promotion_codes?: boolean; // Allow customers to enter promo codes
	subscription_data?: {
		trial_period_days?: number;
		metadata?: Record<string, string>;
	};
	payment_intent_data?: {
		metadata?: Record<string, string>;
	};
}

export interface StripeWebhookEvent {
	id: string;
	object: 'event';
	type: string;
	data: {
		object: any;
		previous_attributes?: {
			status?: string;
			[key: string]: any;
		};
	};
	created: number;
	livemode: boolean;
}

export interface StripeCustomer {
	id: string;
	object: 'customer';
	email?: string;
	name?: string;
	metadata: Record<string, string>;
	created: number;
}

export interface StripePaymentIntent {
	id: string;
	object: 'payment_intent';
	amount: number;
	currency: string;
	status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
	metadata: Record<string, string>;
	customer?: string;
	created: number;
	invoice?: string | null;
}

export interface StripeApiResponse<T> {
	data: T;
	has_more: boolean;
	object: 'list';
	url: string;
}

// Subscription interfaces
export interface StripeSubscription {
	id: string;
	object: 'subscription';
	customer: string;
	status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
	current_period_start: number;
	current_period_end: number;
	cancel_at_period_end?: boolean;
	canceled_at?: number;
	trial_start?: number | null;
	trial_end?: number | null;
	metadata: Record<string, string>;
	created: number;
	discount?: StripeDiscount | null; // Applied discount
}

export interface StripeInvoice {
	id: string;
	object: 'invoice';
	customer: string;
	subscription?: string;
	payment_intent?: string;
	billing_reason?: string;
	amount_paid: number;
	amount_due: number;
	currency: string;
	status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
	metadata: Record<string, string>;
	created: number;
	period_start: number;
	period_end: number;
	hosted_invoice_url?: string;
	invoice_pdf?: string;
	discount?: StripeDiscount | null; // Applied discount
	total_discount_amounts?: Array<{
		// Detailed discount amounts
		amount: number;
		discount: string;
	}>;
}

export interface CreateSubscriptionRequest {
	customer: string;
	items: Array<{
		price: string;
		quantity?: number;
	}>;
	metadata?: Record<string, string>;
	payment_behavior?: 'default_incomplete' | 'allow_incomplete' | 'error_if_incomplete';
	payment_settings?: {
		payment_method_types?: string[];
		save_default_payment_method?: 'on_subscription';
	};
	expand?: string[];
	coupon?: string; // Coupon ID to apply to subscription
}

// Coupon and Discount interfaces
export interface StripeCoupon {
	id: string;
	object: 'coupon';
	amount_off?: number; // Fixed amount discount in cents
	percent_off?: number; // Percentage discount
	currency?: string; // Required if amount_off is set
	duration: 'forever' | 'once' | 'repeating';
	duration_in_months?: number; // Required if duration is 'repeating'
	metadata: Record<string, string>;
	name?: string;
	valid: boolean;
	created: number;
	max_redemptions?: number;
	times_redeemed?: number;
	redeem_by?: number; // Unix timestamp
}

export interface StripePromotionCode {
	id: string;
	object: 'promotion_code';
	code: string; // The customer-facing code
	coupon: StripeCoupon;
	active: boolean;
	expires_at?: number;
	max_redemptions?: number;
	times_redeemed: number;
	restrictions?: {
		first_time_transaction?: boolean;
		minimum_amount?: number;
		minimum_amount_currency?: string;
	};
	metadata: Record<string, string>;
	created: number;
}

export interface StripeDiscount {
	id: string;
	object: 'discount';
	coupon: StripeCoupon;
	customer?: string;
	subscription?: string;
	promotion_code?: string;
	start: number; // Unix timestamp
	end?: number; // Unix timestamp (null if duration is 'forever')
}

export interface PurchaseEventData {
	session_id?: string;
	payment_intent_id: string;
	subscription_id?: string;
	status: string;
	customer_id: string;
	amount: number;
	currency: string;
	product_id?: string;
	price_id?: string;
	user_id?: string;
	email?: string;
	referral_code?: string;
	partner_id?: string;
	campaign_id?: string;
	source?: string;
	click_id?: string;
	affiliate_id?: string;
	utm_source?: string;
	utm_medium?: string;
	utm_campaign?: string;
	utm_term?: string;
	utm_content?: string;
	tolt_referral?: string;
	metadata: Record<string, string>;
	timestamp: string;
}
