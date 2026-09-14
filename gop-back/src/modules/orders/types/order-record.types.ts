export interface IOrderUtm {
	utmSource?: string;
	utmMedium?: string;
	utmCampaign?: string;
}

export interface IOneTimePaymentRecord extends IOrderUtm {
	userId?: string;
	email?: string;
	amountInCents: number;
	currency: string;
	stripePriceId?: string;
	stripePaymentIntentId: string;
	stripeCustomerId?: string;
	paidAtUnix?: number;
}

export interface ISubscriptionInvoiceRecord extends IOrderUtm {
	userId?: string;
	email?: string;
	amountInCents: number;
	currency: string;
	stripePriceId?: string;
	stripeInvoiceId: string;
	stripeSubscriptionId?: string;
	stripePaymentIntentId?: string;
	stripeCustomerId?: string;
	billingReason?: string;
	paidAtUnix?: number;
}

export interface IRefundRecord {
	stripeChargeId: string;
	stripePaymentIntentId?: string;
	amountInCents: number;
	amountRefundedInCents: number;
	refundedAtUnix?: number;
}
