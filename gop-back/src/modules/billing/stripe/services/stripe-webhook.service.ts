import { Injectable, Logger } from '@nestjs/common';
import { StripeApiService } from './stripe-api.service';
import { ReferralTrackingService } from './referral-tracking.service';
import {
	StripeCheckoutSession,
	StripePaymentIntent,
	StripeInvoice,
	StripeSubscription,
	PurchaseEventData,
} from '../interfaces/stripe-api.interface';
import { extractProductAndPriceIds, enrichMetadataWithReferralData, addReferralFieldsToEventData } from '../utils/nats-formatter.util';
import { UserProductEventService } from '../../../user-products/services/user-product-event.service';
import { UserProductsService } from '../../../user-products/services/user-products.service';
import { Ga4MeasurementProtocolService } from './ga4-mp.service';
import { OrdersService } from '../../../orders/services/orders.service';

@Injectable()
export class StripeWebhookService {
	private readonly logger = new Logger(StripeWebhookService.name);

	constructor(
		private readonly stripeApiService: StripeApiService,
		private readonly referralTrackingService: ReferralTrackingService,
		private readonly userProductsService: UserProductsService,
		private readonly userProductEventService: UserProductEventService,
		private readonly ga4: Ga4MeasurementProtocolService,
		private readonly ordersService: OrdersService,
	) {}

	async handleCheckoutSessionCompleted(session: StripeCheckoutSession) {
		const { mode, subscription, payment_intent } = session as any;

		this.logger.log(`[LOG] Checkout session completed mode=${mode} sub=${subscription} pi=${payment_intent}`);

		// GA4 purchase — server-side leg (MADS spec: webhook is the source of
		// truth; the browser leg on /success/* is lossy). Fire-and-forget so a
		// GA outage can never affect billing. payment_status guard excludes
		// unpaid/async sessions AND card-verify setup sessions
		// (payment_status='no_payment_required'). transaction_id uses the SAME
		// fallback order as the browser leg (payment_intent → session id) so
		// GA4 dedupes the two legs to a single sale.
		this.sendGa4Purchase(session as any);

		if (mode === 'subscription' && subscription) {
			await this.handleSubscriptionCheckout(session, subscription);
		}
	}

	private sendGa4Purchase(s: any): void {
		try {
			if (s?.payment_status !== 'paid') return;
			const txId = (typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent?.id) || s.id;
			if (!txId) return;
			const email = s.customer_details?.email || s.customer_email;
			const value = typeof s.amount_total === 'number' ? Number((s.amount_total / 100).toFixed(2)) : undefined;
			const itemName = s.metadata?.product_name || 'God of Prompt digital product';
			void this.ga4.send(
				'purchase',
				{
					transaction_id: String(txId),
					...(value !== undefined ? { value } : {}),
					tax: 0,
					currency: String(s.currency || 'usd').toUpperCase(),
					...(s.metadata?.coupon ? { coupon: s.metadata.coupon } : {}),
					payment_provider: 'stripe',
					items: [
						{
							item_id: s.metadata?.price_id || s.metadata?.slug || 'gop-digital-product',
							item_name: itemName,
							...(value !== undefined ? { price: value } : {}),
							quantity: 1,
						},
					],
				},
				{ seed: String(txId), userId: this.ga4.hashEmail(email) },
			);
		} catch (e: any) {
			this.logger.warn(`GA4 purchase leg failed to build: ${e?.message}`);
		}
	}

	async handlePaymentIntentSucceeded(paymentIntent: StripePaymentIntent) {
		try {
			// Subscription invoice payments also fire payment_intent.succeeded, but they carry
			// no user_id/email in metadata (those live on the subscription/invoice). Subscription
			// billing is fully handled by invoice.payment_succeeded — skip here to avoid a 500.
			if (paymentIntent.invoice) {
				this.logger.log(`Skipping subscription invoice payment_intent ${paymentIntent.id}`);
				return;
			}

			const sessions = await this.stripeApiService.getCheckoutSessionsByPaymentIntent(paymentIntent.id, 1);

			const session = sessions.data?.[0];

			if (session) {
				const { mode, payment_intent } = session as any;

				const isLifetime = mode === 'subscription' && payment_intent;

				if (session.status === 'complete' && (mode === 'payment' || isLifetime)) {
					await this.publishPurchaseEvent(session.id, paymentIntent.id);
				}

				return;
			}

			await this.ordersService.recordOneTimePayment({
				userId: paymentIntent.metadata?.user_id,
				email: paymentIntent.metadata?.email,
				amountInCents: paymentIntent.amount,
				currency: paymentIntent.currency,
				stripePriceId: paymentIntent.metadata?.price_id,
				stripePaymentIntentId: paymentIntent.id,
				stripeCustomerId: paymentIntent.customer,
				paidAtUnix: paymentIntent.created,
				utmSource: paymentIntent.metadata?.utm_source,
				utmMedium: paymentIntent.metadata?.utm_medium,
				utmCampaign: paymentIntent.metadata?.utm_campaign,
			});

			await this.userProductEventService.handlePurchaseCompleted({
				...paymentIntent,
				customer_id: paymentIntent.metadata.user_id,
				payment_intent_id: paymentIntent.id,
			});
			this.syncUserIdToCustomer(paymentIntent.customer, paymentIntent.metadata?.user_id);
		} catch (error) {
			this.logger.error(`handlePaymentIntentSucceeded failed: ${paymentIntent.id}`, error);
			throw error;
		}
	}

	async handleInvoicePaymentSucceeded(invoice: StripeInvoice) {
		try {
			const metadata = await this.resolveInvoiceMetadata(invoice);

			if (invoice.amount_paid === 0) {
				this.logger.log(`Skipping trial invoice ${invoice.id}`);
				return;
			}

			const priceId = this.extractInvoicePriceId(invoice);

			// recorded before the provisioning guards below — renewals return early there, and a
			// renewal is exactly what the orders log exists to capture
			await this.ordersService.recordSubscriptionInvoice({
				userId: metadata?.user_id,
				email: metadata?.email,
				amountInCents: invoice.amount_paid,
				currency: invoice.currency,
				stripePriceId: priceId,
				stripeInvoiceId: invoice.id,
				stripeSubscriptionId: invoice.subscription,
				stripePaymentIntentId: invoice.payment_intent,
				stripeCustomerId: invoice.customer,
				billingReason: invoice.billing_reason,
				paidAtUnix: invoice.created,
				utmSource: metadata?.utm_source,
				utmMedium: metadata?.utm_medium,
				utmCampaign: metadata?.utm_campaign,
			});

			if (!priceId) {
				this.logger.warn(`No price_id for invoice ${invoice.id}`);
				return;
			}

			// Guard against renewal invoices: customer.subscription.updated handles period
			// renewals, so if a user_product already exists we have nothing to do here.
			// If no record exists (e.g. customer.subscription.created was missed), fall
			// through and provision the user_product as a recovery path.
			if (invoice.subscription) {
				const existing = await this.userProductsService.findBySubscriptionId(invoice.subscription);

				if (existing) {
					this.logger.log(`Subscription already processed: ${invoice.subscription}`);
					return;
				}
			}

			await this.userProductEventService.handleSubscriptionCreated({
				subscription_id: invoice.subscription,
				customer_id: invoice.customer,
				status: 'active',
				price_id: priceId,
				current_period_start: invoice.period_start,
				current_period_end: invoice.period_end,
				metadata,
			});
			this.syncUserIdToCustomer(invoice.customer as string, metadata?.user_id);
		} catch (error) {
			this.logger.error(`handleInvoicePaymentSucceeded failed: ${invoice.id}`, error);
			throw error;
		}
	}

	async handleInvoicePaymentFailed(invoice: StripeInvoice) {
		const subscriptionId = invoice.subscription;
		if (!subscriptionId) {
			this.logger.log(`invoice.payment_failed ${invoice.id} — no subscription, skipping`);
			return;
		}

		await this.userProductEventService.handleSubscriptionTerminated({
			subscription_id: subscriptionId,
			customer_id: invoice.customer,
			status: 'past_due',
			canceled_at: undefined,
			price_id: undefined,
			metadata: {},
		});
	}

	async handleSubscriptionCreated(subscription: StripeSubscription) {
		try {
			if (this.hasTrial(subscription)) {
				await this.handleSubscriptionTrialStarted(subscription);
			}

			const full = await this.getFullSubscriptionWithItems(subscription);
			const payload = this.formatSubscription(full);

			await this.userProductEventService.handleSubscriptionCreated(payload);
			this.syncUserIdToCustomer(full.customer as string, (full as any).metadata?.user_id);
		} catch (error) {
			this.logger.error(`handleSubscriptionCreated failed: ${subscription.id}`, error);
			throw error;
		}
	}

	async handleSubscriptionUpdated(subscription: StripeSubscription, prev?: { status?: string }) {
		if (subscription.status === 'trialing' && prev?.status !== 'trialing') {
			await this.handleSubscriptionTrialStarted(subscription);
		}

		if (prev?.status === 'trialing' && subscription.status === 'active') {
			await this.handleSubscriptionTrialEnded(subscription);
		}

		const { priceId } = extractProductAndPriceIds((subscription as any).items);

		const basePayload = {
			customer_id: subscription.metadata.user_id,
			status: subscription.status,
			subscription_id: subscription.id,
			canceled_at: subscription.canceled_at,
			price_id: priceId,
			metadata: subscription.metadata,
		};

		if (this.isTerminatedStatus(subscription.status)) {
			await this.userProductEventService.handleSubscriptionTerminated(basePayload);
			return;
		}

		await this.userProductEventService.handleSubscriptionUpdated({
			...basePayload,
			current_period_start: subscription.current_period_start,
			current_period_end: subscription.current_period_end,
		});
	}

	async handleSubscriptionDeleted(subscription: StripeSubscription) {
		const { priceId } = extractProductAndPriceIds((subscription as any).items);

		return this.userProductEventService.handleSubscriptionTerminated({
			customer_id: subscription.metadata.user_id,
			status: subscription.status,
			subscription_id: subscription.id,
			canceled_at: subscription.canceled_at,
			price_id: priceId,
			metadata: subscription.metadata,
		});
	}

	async handleChargeRefunded(charge: any) {
		const metadata = await this.resolveChargeMetadata(charge);

		await this.ordersService.applyRefund({
			stripeChargeId: charge.id,
			stripePaymentIntentId: charge.payment_intent,
			amountInCents: charge.amount,
			amountRefundedInCents: charge.amount_refunded,
			refundedAtUnix: charge.refunds?.data?.[0]?.created,
		});

		await this.userProductEventService.handleRefund({
			charge_id: charge.id,
			customer_id: charge.customer,
			amount: charge.amount,
			amount_refunded: charge.amount_refunded,
			currency: charge.currency,
			payment_intent_id: charge.payment_intent,
			metadata,
		});
	}

	async handleSubscriptionTrialStarted(subscription: StripeSubscription) {
		try {
			const userId = subscription.metadata?.user_id;
			if (!userId) {
				this.logger.warn(`Subscription ${subscription.id} has no user_id in metadata`);
				return;
			}

			const trialStart = subscription.trial_start;
			const trialEnd = subscription.trial_end;

			if (!trialStart || !trialEnd) {
				this.logger.warn(`Subscription ${subscription.id} has no trial period`);
				return;
			}

			const existing = await this.userProductsService.findBySubscriptionId(subscription.id);

			if (existing?.status === 'active') {
				this.logger.log(`Trial already started / user_product active for subscription ${subscription.id}`);
				return;
			}

			await this.userProductEventService.handleTrialStarted({
				customer_id: userId,
				subscription_id: subscription.id,
				status: 'active',
				trial_start: trialStart,
				trial_end: trialEnd,
				metadata: subscription.metadata,
			});

			this.logger.log(`Trial started — activated user_product for subscription ${subscription.id}`);
		} catch (error) {
			this.logger.error(`handleSubscriptionTrialStarted failed: ${subscription.id}`, error);
			throw error;
		}
	}

	async handleSubscriptionTrialEnded(subscription: StripeSubscription) {
		try {
			const userId = subscription.metadata?.user_id;
			if (!userId) {
				this.logger.warn(`Subscription ${subscription.id} has no user_id in metadata`);
				return;
			}

			const existing = await this.userProductsService.findBySubscriptionId(subscription.id);
			if (!existing) {
				this.logger.warn(`No user_product found for subscription ${subscription.id}`);
				return;
			}

			if (existing.status === 'inactive') {
				this.logger.log(`Trial already ended / subscription inactive for ${subscription.id}`);
				return;
			}

			await this.userProductEventService.handleTrialEnded({
				customer_id: userId,
				subscription_id: subscription.id,
				status: 'inactive',
				trial_end: subscription.trial_end,
			});

			this.logger.log(`Trial ended — deactivated user_product for subscription ${subscription.id}`);
		} catch (error) {
			this.logger.error(`handleSubscriptionTrialEnded failed: ${subscription.id}`, error);
			throw error;
		}
	}

	private async publishPurchaseEvent(sessionId: string, paymentIntentId: string, subscriptionId?: string) {
		const session = await this.stripeApiService.getSession(sessionId);
		const data = await this.formatPayment(session, subscriptionId);

		if (!data.payment_intent_id) {
			data.payment_intent_id = paymentIntentId;
		}

		await this.ordersService.recordOneTimePayment({
			userId: data.user_id,
			email: data.email,
			amountInCents: data.amount,
			currency: data.currency,
			stripePriceId: data.price_id,
			stripePaymentIntentId: data.payment_intent_id,
			stripeCustomerId: data.customer_id,
			paidAtUnix: session.created,
			utmSource: data.utm_source,
			utmMedium: data.utm_medium,
			utmCampaign: data.utm_campaign,
		});

		await this.userProductEventService.handlePurchaseCompleted(data);
		this.syncUserIdToCustomer(data.customer_id, data.user_id);
	}

	private async handleSubscriptionCheckout(session: StripeCheckoutSession, subId: string) {
		try {
			const sub = await this.stripeApiService.getSubscription(subId);

			await this.syncSessionMetadataToSubscription(session, sub);
		} catch (error) {
			this.logger.error(`handleSubscriptionCheckout failed: ${subId}`, error);
			throw error;
		}
	}

	private async syncSessionMetadataToSubscription(session: StripeCheckoutSession, subscription: StripeSubscription): Promise<void> {
		try {
			const sessionMetadata = session.metadata || {};
			const subscriptionMetadata = subscription.metadata || {};

			const mergedMetadata: Record<string, string> = {
				...sessionMetadata,
				...subscriptionMetadata,
			};

			const isSame = Object.keys(mergedMetadata).length === Object.keys(subscriptionMetadata).length;

			if (isSame) {
				this.logger.log(`Metadata already synced for subscription ${subscription.id}`);
				return;
			}

			await this.stripeApiService.updateSubscription(subscription.id, {
				metadata: mergedMetadata,
			});

			this.logger.log(`Metadata synced for subscription ${subscription.id}`);
		} catch (error) {
			this.logger.error(`syncSessionMetadataToSubscription failed: ${subscription.id}`, error);
		}
	}

	private async resolveInvoiceMetadata(invoice: StripeInvoice) {
		let metadata = invoice.metadata || {};

		if (invoice.subscription) {
			const sub = await this.stripeApiService.getSubscription(invoice.subscription);
			metadata = { ...metadata, ...(sub?.metadata || {}) };
		}

		if (invoice.customer && (!metadata.user_id || !metadata.email)) {
			const customerMeta = await this.getMetadataFromCustomer(invoice.customer);
			if (customerMeta) {
				metadata = { ...metadata, ...customerMeta };
			}
		}

		return this.enrichMetadata(metadata);
	}

	private async resolveChargeMetadata(charge: any) {
		let metadata = charge.metadata || {};

		if (Object.keys(metadata).length > 0) {
			return metadata;
		}

		if (!charge.payment_intent) return metadata;

		const fromPI = await this.getMetadataFromPaymentIntent(charge.payment_intent);
		if (fromPI) return fromPI;

		return await this.getMetadataFromCheckoutSessionByPaymentIntent(charge.payment_intent);
	}

	private enrichMetadata(metadata: Record<string, string>) {
		const referral = this.referralTrackingService.extractReferralData(metadata);
		return enrichMetadataWithReferralData(metadata, referral);
	}

	private attachUserFields(event: any, metadata: any) {
		if (metadata.user_id) event.user_id = metadata.user_id;
		if (metadata.email) event.email = metadata.email;
	}

	private attachReferral(event: any, metadata: any) {
		const referral = this.referralTrackingService.extractReferralData(metadata);
		addReferralFieldsToEventData(event, referral);
	}

	private extractInvoicePriceId(invoice: StripeInvoice) {
		return (invoice as any).lines?.data?.[0]?.price?.id;
	}

	private isTerminatedStatus(status: string) {
		return ['canceled', 'unpaid', 'past_due'].includes(status);
	}

	private hasTrial(subscription: StripeSubscription) {
		const s = subscription as any;
		return subscription.status === 'trialing' || (s.trial_start && s.trial_end);
	}

	private async getMetadataFromPaymentIntent(paymentIntentId: string) {
		const pi = await this.stripeApiService.getPaymentIntent(paymentIntentId);
		return Object.keys(pi.metadata || {}).length ? pi.metadata : null;
	}

	private async getMetadataFromCheckoutSessionByPaymentIntent(paymentIntentId: string) {
		const sessions = await this.stripeApiService.getCheckoutSessionsByPaymentIntent(paymentIntentId, 1);
		return sessions.data?.[0]?.metadata || null;
	}

	private async getMetadataFromCustomer(customerId: string) {
		const customer = await this.stripeApiService.getCustomer(customerId);
		const metadata = { ...(customer.metadata || {}) };

		if (customer.email && !metadata.email) {
			metadata.email = customer.email;
		}

		return Object.keys(metadata).length ? metadata : null;
	}

	private async getFullSubscriptionWithItems(subscription: StripeSubscription) {
		try {
			const full = await this.stripeApiService.getSubscription(subscription.id);

			if (!full.metadata?.user_id || !full.metadata?.email) {
				const fallback =
					(await this.getMetadataFromCheckoutSession(subscription.id)) || (await this.getMetadataFromInvoice(subscription.id));

				if (fallback) {
					full.metadata = { ...full.metadata, ...fallback };
				}
			}

			return full;
		} catch (e) {
			this.logger.error(`getFullSubscriptionWithItems failed`, e);
			return subscription;
		}
	}

	private async getMetadataFromCheckoutSession(subscriptionId: string) {
		const sessions = await this.stripeApiService.getCheckoutSessionsBySubscription(subscriptionId, 1);
		return sessions.data?.[0]?.metadata || null;
	}

	private async getMetadataFromInvoice(subscriptionId: string) {
		const invoices = await this.stripeApiService.getInvoicesBySubscription(subscriptionId, 1);
		return invoices.data?.[0]?.metadata || null;
	}

	private async formatPayment(session: any, subscriptionId?: string): Promise<PurchaseEventData> {
		let metadata = await this.enrichMetadataFromSources(session.metadata || {}, session);

		const { productId, priceId } = extractProductAndPriceIds(session.line_items);
		const referral = this.referralTrackingService.extractReferralData(metadata);

		const enriched = enrichMetadataWithReferralData(metadata, referral);

		return {
			session_id: session.id,
			payment_intent_id: session.payment_intent,
			subscription_id: subscriptionId || session.subscription,
			status: session.payment_status,
			customer_id: session.customer,
			amount: session.amount_total,
			currency: session.currency,
			product_id: productId,
			price_id: priceId,
			user_id: metadata.user_id,
			email: metadata.email,
			...referral,
			metadata: enriched,
			timestamp: new Date().toISOString(),
		};
	}

	private async enrichMetadataFromSources(metadata: any, session: any) {
		if (!metadata.user_id && session.payment_intent) {
			const pi = await this.getMetadataFromPaymentIntent(session.payment_intent);
			if (pi) metadata = { ...metadata, ...pi };
		}

		if (!metadata.email && session.customer_details?.email) {
			metadata = { ...metadata, email: session.customer_details.email };
		}

		if (!metadata.email && session.customer) {
			const customer = await this.getMetadataFromCustomer(session.customer);
			if (customer) metadata = { ...metadata, ...customer };
		}

		return metadata;
	}

	private formatSubscription(subscription: any) {
		const { productId, priceId } = extractProductAndPriceIds(subscription.items);

		const referral = this.referralTrackingService.extractReferralData(subscription.metadata);
		const metadata = enrichMetadataWithReferralData(subscription.metadata, referral);

		const event: any = {
			subscription_id: subscription.id,
			status: subscription.status,
			customer_id: subscription.customer,
			current_period_start: subscription.current_period_start,
			current_period_end: subscription.current_period_end,
			metadata,
			timestamp: new Date().toISOString(),
		};

		if (productId) event.product_id = productId;
		if (priceId) event.price_id = priceId;
		if (metadata.user_id) event.user_id = metadata.user_id;
		if (metadata.email) event.email = metadata.email;

		addReferralFieldsToEventData(event, referral);

		return event;
	}

	private syncUserIdToCustomer(customerId: string | undefined, userId: string | undefined): void {
		if (!customerId || !userId) return;

		this.stripeApiService
			.updateCustomer(customerId, { user_id: userId })
			.catch((err) => this.logger.warn(`syncUserIdToCustomer failed for customer ${customerId}: ${err?.message}`));
	}
}
