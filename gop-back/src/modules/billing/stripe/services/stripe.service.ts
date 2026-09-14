import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { StripeApiService } from './stripe-api.service';
import { ReferralTrackingService } from './referral-tracking.service';
import { StripeWebhookService } from './stripe-webhook.service';
import { CreateCheckoutSessionWithTrackingDto } from '../dto/stripe.dto';
import { createSuccessResponse, createErrorResponse } from '../utils/response.util';
import { CreateRefundDto } from '../dto/create-refund.dto';
import { CancelSubscriptionDto } from '../dto/subscription-cancel.dto';
import { UpdateSubscriptionDto } from '../dto/subscription-update.dto';
import { AuthUser } from '../../../../common/types';
import { UserProductEventService } from '../../../user-products/services/user-product-event.service';
import { UserProductsService } from '../../../user-products/services/user-products.service';
import { CreateCheckoutSessionRequest, StripeSubscription } from '../interfaces/stripe-api.interface';

@Injectable()
export class StripeService {
	private readonly logger = new Logger(StripeService.name);

	constructor(
		private readonly stripeApiService: StripeApiService,
		private readonly userProductEventService: UserProductEventService,
		private readonly userProductsService: UserProductsService,
		private readonly referralTrackingService: ReferralTrackingService,
		private readonly stripeWebhookService: StripeWebhookService,
	) {}

	async createCheckoutSessionWithTracking(body: CreateCheckoutSessionWithTrackingDto) {
		try {
			const referralData = this.referralTrackingService.extractReferralData(body);

			let priceId = body.price_id;
			if (!priceId && body.product_id) {
				const prices = await this.stripeApiService.getProductPrices(body.product_id);
				if (!prices.data?.length) throw new BadRequestException('No active prices found');
				priceId = prices.data[0].id;
			}

			if (!priceId) throw new BadRequestException('price_id or product_id required');

			const metadata = {
				...(body.metadata || {}),
				price_id: priceId,
				...this.referralTrackingService.createMetadata(referralData),
			};

			const sessionData: CreateCheckoutSessionRequest = {
				success_url: body.success_url,
				cancel_url: body.cancel_url,
				line_items: [{ price: priceId, quantity: 1 }],
				mode: 'payment',
				metadata,
				payment_intent_data: { metadata },
				allow_promotion_codes: true,
			};

			const session = await this.stripeApiService.createCheckoutSession(sessionData);

			return createSuccessResponse({ session_id: session.id, url: session.url });
		} catch (error) {
			this.logger.error('Failed to create checkout session with tracking', error);
			return createErrorResponse(error.message);
		}
	}

	async createSubscriptionCheckoutWithTracking(body: CreateCheckoutSessionWithTrackingDto, user?: AuthUser) {
		try {
			const referralData = this.referralTrackingService.extractReferralData(body);
			const customerId = await this.getOrCreateStripeCustomer(user);

			const metadata = {
				...(body.metadata || {}),
				user_id: user.userId,
				email: user.email,
				webhook_id: process.env.APP_TITLE,
				price_id: body.price_id,
				...this.referralTrackingService.createMetadata(referralData),
			};

			const sessionData: CreateCheckoutSessionRequest = {
				success_url: body.success_url,
				cancel_url: body.cancel_url,
				line_items: [{ price: body.price_id, quantity: 1 }],
				mode: 'subscription',
				customer: customerId,
				metadata,
				subscription_data: {
					trial_period_days: body.subscription_data?.trial_period_days ?? 7,
					metadata: {
						...metadata,
						...(body.subscription_data?.metadata || {}),
					},
				},
				allow_promotion_codes: true,
			};

			const session = await this.stripeApiService.createCheckoutSession(sessionData);

			this.logger.log(`Subscription checkout session created: ${session.id}`);

			return createSuccessResponse({ session_id: session.id, url: session.url, session });
		} catch (error) {
			this.logger.error('Failed to create subscription checkout session with tracking', error);
			return createErrorResponse(error.message);
		}
	}

	async getSessionData(sessionId: string) {
		try {
			this.logger.log(`Fetching session data for: ${sessionId}`);

			const session = await this.stripeApiService.getSession(sessionId);

			if (!session) {
				this.logger.warn(`Session not found: ${sessionId}`);
				return createErrorResponse('Session not found', { session_id: sessionId });
			}

			return createSuccessResponse({
				session_id: session.id,
				payment_status: session.payment_status,
				customer_email: session.customer_details?.email,
				customer_id: session.customer,
				amount_total: session.amount_total,
				currency: session.currency,
				payment_intent_id: session.payment_intent,
				metadata: session.metadata,
				session,
			});
		} catch (error) {
			this.logger.error(`Failed to fetch session data for ${sessionId}:`, error);
			return createErrorResponse(error.message, { session_id: sessionId });
		}
	}

	async cancelSubscription(body: CancelSubscriptionDto) {
		try {
			const subscription = await this.stripeApiService.cancelSubscription(
				body.subscription_id,
				body.immediate || false,
				body.cancellation_reason,
			);

			this.logger.log('Subscription canceled successfully');

			return createSuccessResponse({
				subscription_id: subscription.id,
				status: subscription.status,
				canceled_at: subscription.canceled_at,
				cancel_at_period_end: subscription.cancel_at_period_end,
				subscription,
			});
		} catch (error) {
			this.logger.error('Failed to cancel subscription:', error);
			return createErrorResponse(error.message);
		}
	}

	async updateSubscription(body: UpdateSubscriptionDto) {
		try {
			const metadata =
				body.price_id || body.metadata
					? {
							...(body.metadata || {}),
							...(body.price_id && { price_id: body.price_id }),
						}
					: undefined;

			const subscription = await this.stripeApiService.updateSubscription(body.subscription_id, {
				priceId: body.price_id,
				quantity: body.quantity,
				prorationBehavior: body.proration_behavior,
				metadata,
			});

			try {
				const fullSubscription: StripeSubscription = await this.stripeApiService.getSubscription(subscription.id);

				await this.userProductEventService.handleSubscriptionUpdated({
					subscription_id: fullSubscription.id,
					customer_id: fullSubscription.metadata.user_id,
					...fullSubscription,
				});
			} catch (error) {
				this.logger.error('Failed to emit subscription.update event:', error);
			}

			return createSuccessResponse({
				subscription_id: subscription.id,
				status: subscription.status,
				current_period_start: subscription.current_period_start,
				current_period_end: subscription.current_period_end,
				subscription,
			});
		} catch (error) {
			this.logger.error('Failed to update subscription:', error);
			return createErrorResponse(error.message);
		}
	}

	async getSubscriptionData(subscriptionId: string) {
		try {
			const subscription = await this.stripeApiService.getSubscription(subscriptionId);

			if (!subscription) {
				this.logger.warn(`Subscription not found: ${subscriptionId}`);
				return createErrorResponse('Subscription not found', { subscription_id: subscriptionId });
			}

			return createSuccessResponse({
				subscription_id: subscription.id,
				status: subscription.status,
				customer_id: subscription.customer,
				current_period_start: subscription.current_period_start,
				current_period_end: subscription.current_period_end,
				cancel_at_period_end: subscription.cancel_at_period_end,
				canceled_at: subscription.canceled_at,
				metadata: subscription.metadata,
				subscription,
			});
		} catch (error) {
			this.logger.error(`Failed to fetch subscription data for ${subscriptionId}:`, error);
			return createErrorResponse(error.message, { subscription_id: subscriptionId });
		}
	}

	async getCustomerSubscriptions(customerId: string) {
		try {
			this.logger.log(`Fetching subscriptions for customer: ${customerId}`);

			const subscriptions = await this.stripeApiService.getCustomerSubscriptions(customerId);

			this.logger.log('Customer subscriptions retrieved successfully:', {
				customer_id: customerId,
				subscriptions_count: subscriptions.data?.length || 0,
			});

			return createSuccessResponse({
				customer_id: customerId,
				subscriptions: subscriptions.data || [],
				total_count: subscriptions.data?.length || 0,
			});
		} catch (error) {
			this.logger.error(`Failed to fetch subscriptions for customer ${customerId}:`, error);
			return createErrorResponse(error.message, { customer_id: customerId });
		}
	}

	async createRefund(body: CreateRefundDto) {
		try {
			const paymentData = await this.stripeApiService.findPaymentIntentByMemberAndProduct(body.memberId, body.productId);

			if (!paymentData) {
				this.logger.warn(
					`No payment found for memberId: ${body.memberId}, productId: ${body.productId}. Deactivating product anyway`,
				);

				await this.userProductEventService.handleRefund({
					charge_id: 'admin_refund',
					customer_id: body.memberId,
					product_id: body.productId,
				});

				return createSuccessResponse({
					message: 'Product access removed (no payment found)',
				});
			}

			if (paymentData.paymentIntent.status === 'canceled') {
				return createErrorResponse('Payment has already been canceled');
			}

			let refundAmount = body.amount || paymentData.productAmount;

			if (body.amount > paymentData.productAmount) {
				this.logger.warn(
					`Requested refund amount ${body.amount} exceeds product amount ${paymentData.productAmount}. Using product amount.`,
				);
				refundAmount = paymentData.productAmount;
			}

			if (refundAmount <= 0) {
				return createErrorResponse('Invalid refund amount. Product amount is 0 or negative.');
			}

			const refund = await this.stripeApiService.createRefund(paymentData.paymentIntent.id, refundAmount, body.reason);

			try {
				await this.userProductEventService.handleRefund({
					charge_id: refund.id,
					customer_id: body.memberId,
					product_id: body.productId,
				});
			} catch (error) {
				this.logger.error('Failed to remove refunded product', error);
			}

			return createSuccessResponse({
				refund_id: refund.id,
				payment_intent_id: paymentData.paymentIntent.id,
				product_amount: paymentData.productAmount,
				amount: refund.amount,
				currency: refund.currency,
				status: refund.status,
				refund,
			});
		} catch (error) {
			this.logger.error('Failed to create refund:', error);
			return createErrorResponse(error.message);
		}
	}

	async testSubscriptionWebhook(subId: string) {
		try {
			this.logger.log(`Testing subscription webhook for ${subId}`);

			const subscription = await this.stripeApiService.getSubscription(subId);

			this.logger.log(`Fetched subscription ${subId} from Stripe:`, {
				id: subscription.id,
				status: subscription.status,
				has_metadata: !!subscription.metadata,
				metadata_keys: subscription.metadata ? Object.keys(subscription.metadata) : [],
				metadata: subscription.metadata,
			});

			await this.stripeWebhookService.handleSubscriptionUpdated(subscription);

			return createSuccessResponse({
				message: `Subscription webhook event simulated for ${subId}`,
				subscription_id: subscription.id,
				status: subscription.status,
				metadata: subscription.metadata,
			});
		} catch (error) {
			this.logger.error(`Failed to test subscription webhook for ${subId}:`, error);
			return createErrorResponse(error.message, { subscription_id: subId });
		}
	}

	private async getOrCreateStripeCustomer(user: AuthUser): Promise<string> {
		const existingId = await this.userProductsService.getStripeCustomerId(user.userId);
		if (existingId) return existingId;

		const existing = await this.stripeApiService.searchCustomerByEmail(user.email);
		if (existing) {
			await this.userProductsService.updateUserStripeId(user.userId, existing.id);
			return existing.id;
		}

		const customer = await this.stripeApiService.createCustomer(user.email, undefined, {
			user_id: user.userId,
		});

		await this.userProductsService.updateUserStripeId(user.userId, customer.id);

		return customer.id;
	}
}
