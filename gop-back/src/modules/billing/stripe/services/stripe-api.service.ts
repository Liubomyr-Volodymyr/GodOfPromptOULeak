import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import Stripe from 'stripe';
import {
	StripeCheckoutSession,
	StripeCustomer,
	StripePaymentIntent,
	StripeWebhookEvent,
	StripeSubscription,
	StripeInvoice,
	CreateCheckoutSessionRequest,
} from '../interfaces/stripe-api.interface';
import { LoggerService } from '../../../../infra/logger/services/logger.service';
import { STRIPE_CONFIG } from '../../../../config/enums';
import { INJECTION_TOKENS } from '../../../../common/constants';

@Injectable()
export class StripeApiService {
	private readonly logger = new Logger(StripeApiService.name);
	private readonly secretKey: string;
	private readonly webhookSecret: string;
	private readonly baseUrl = 'https://api.stripe.com/v1';

	constructor(
		private readonly configService: ConfigService,
		private readonly httpService: HttpService,
		private readonly loggerService: LoggerService,
		@Inject(INJECTION_TOKENS.STRIPE_CLIENT)
		private readonly stripeClient: Stripe,
	) {
		this.secretKey = this.configService.get<string>(STRIPE_CONFIG.STRIPE_SECRET_KEY);
		this.webhookSecret = this.configService.get<string>(STRIPE_CONFIG.STRIPE_WEBHOOK_SECRET);
	}

	private getHeaders() {
		return {
			Authorization: `Bearer ${this.secretKey}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		};
	}

	private async makeRequest<T>(method: string, endpoint: string, data?: any): Promise<T> {
		try {
			const url = `${this.baseUrl}${endpoint}`;

			let formData = '';
			if (data) {
				const formParams = new URLSearchParams();

				const flattenObject = (obj: any, prefix = '') => {
					for (const key in obj) {
						if (obj.hasOwnProperty(key)) {
							const value = obj[key];
							const newKey = prefix ? `${prefix}[${key}]` : key;

							if (value && typeof value === 'object' && !Array.isArray(value)) {
								flattenObject(value, newKey);
							} else if (Array.isArray(value)) {
								value.forEach((item, index) => {
									if (typeof item === 'object') {
										flattenObject(item, `${newKey}[${index}]`);
									} else {
										formParams.append(`${newKey}[${index}]`, item);
									}
								});
							} else if (value !== undefined && value !== null) {
								formParams.append(newKey, value);
							}
						}
					}
				};

				flattenObject(data);
				formData = formParams.toString();
			}

			const config = {
				method,
				url,
				headers: this.getHeaders(),
				...(data && { data: formData }),
			};

			this.logger.debug(`Making ${method} request to ${url}`);
			this.logger.debug(`Request data: ${formData}`);

			const response = await firstValueFrom(this.httpService.request(config));
			return response.data;
		} catch (error) {
			const errorDetails = {
				message: error.message,
				status: error.response?.status,
				statusText: error.response?.statusText,
				data: error.response?.data,
				path: endpoint,
				method,
				requestData: data,
			};

			this.logger.error(`Stripe API error: ${error.message}`, JSON.stringify(errorDetails, null, 2));

			this.loggerService.error({
				statusCode: error.response?.status || 500,
				path: endpoint,
				method,
				body: data,
				message: `Stripe API ${method} request failed: ${error.message}`,
			});

			// Include Stripe error details in the thrown error
			const enhancedError = new Error(error.response?.data?.error?.message || error.message);
			(enhancedError as any).stripeError = error.response?.data?.error;
			(enhancedError as any).statusCode = error.response?.status;
			throw enhancedError;
		}
	}

	async createCheckoutSession(sessionData: CreateCheckoutSessionRequest): Promise<StripeCheckoutSession> {
		return this.makeRequest<StripeCheckoutSession>('POST', '/checkout/sessions', sessionData);
	}

	verifyWebhookSignature(rawBody: Buffer | string, signature: string): StripeWebhookEvent {
		return this.stripeClient.webhooks.constructEvent(rawBody, signature, this.webhookSecret) as unknown as StripeWebhookEvent;
	}

	async getSubscription(subscriptionId: string): Promise<StripeSubscription> {
		const subscription = await this.makeRequest<StripeSubscription>(
			'GET',
			`/subscriptions/${subscriptionId}?expand[]=items.data.price.product`,
		);
		return subscription;
	}

	async getCustomerSubscriptions(customerId: string): Promise<{
		data: StripeSubscription[];
		has_more: boolean;
	}> {
		return this.makeRequest<{
			data: StripeSubscription[];
			has_more: boolean;
		}>('GET', `/subscriptions?customer=${customerId}`);
	}

	async cancelSubscription(subscriptionId: string, immediate: boolean = false, cancellationReason?: string): Promise<StripeSubscription> {
		const cancelData: any = immediate ? {} : { cancel_at_period_end: true };

		if (cancellationReason) {
			cancelData.metadata = {
				cancellation_reason: cancellationReason,
			};
		}

		return this.makeRequest<StripeSubscription>('POST', `/subscriptions/${subscriptionId}`, cancelData);
	}

	async updateSubscription(
		subscriptionId: string,
		updateData: {
			priceId?: string;
			quantity?: number;
			prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
			metadata?: Record<string, string>;
		},
	): Promise<StripeSubscription> {
		const updatePayload: any = {};

		if (updateData.priceId) {
			updatePayload.items = [
				{
					price: updateData.priceId,
					quantity: updateData.quantity || 1,
				},
			];
		} else if (updateData.quantity) {
			// Update quantity for existing subscription items
			updatePayload.items = [
				{
					quantity: updateData.quantity,
				},
			];
		}

		if (updateData.prorationBehavior) {
			updatePayload.proration_behavior = updateData.prorationBehavior;
		}

		if (updateData.metadata) {
			updatePayload.metadata = updateData.metadata;
		}

		return this.makeRequest<StripeSubscription>('POST', `/subscriptions/${subscriptionId}`, updatePayload);
	}

	async getCustomer(customerId: string): Promise<StripeCustomer> {
		return this.makeRequest<StripeCustomer>('GET', `/customers/${customerId}`);
	}

	async searchCustomerByEmail(email: string): Promise<StripeCustomer | null> {
		const result = await this.makeRequest<{ data: StripeCustomer[] }>('GET', `/customers?email=${encodeURIComponent(email)}&limit=1`);
		return result.data?.[0] ?? null;
	}

	async createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<StripeCustomer> {
		return this.makeRequest<StripeCustomer>('POST', '/customers', {
			email,
			...(name && { name }),
			...(metadata && { metadata }),
		});
	}

	async updateCustomer(customerId: string, metadata: Record<string, string>): Promise<StripeCustomer> {
		return this.makeRequest<StripeCustomer>('POST', `/customers/${customerId}`, { metadata });
	}

	async getInvoicesBySubscription(
		subscriptionId: string,
		limit: number = 1,
	): Promise<{
		data: StripeInvoice[];
		has_more: boolean;
	}> {
		return this.makeRequest<{
			data: StripeInvoice[];
			has_more: boolean;
		}>('GET', `/invoices?subscription=${subscriptionId}&limit=${limit}`);
	}

	async getProductPrices(productId: string): Promise<any> {
		try {
			return await this.makeRequest<any>('GET', `/prices?product=${productId}&active=true`);
		} catch (error) {
			this.logger.error(`Failed to get prices for product ${productId}:`, error);
			throw error;
		}
	}

	async getSession(sessionId: string): Promise<any> {
		return await this.makeRequest<any>('GET', `/checkout/sessions/${sessionId}?expand[]=line_items.data.price.product`);
	}

	async getCheckoutSessionsBySubscription(
		subscriptionId: string,
		limit: number = 1,
	): Promise<{
		data: any[];
		has_more: boolean;
	}> {
		return this.makeRequest<{
			data: any[];
			has_more: boolean;
		}>('GET', `/checkout/sessions?subscription=${subscriptionId}&limit=${limit}`);
	}

	async getCheckoutSessionsByPaymentIntent(
		paymentIntentId: string,
		limit: number = 1,
	): Promise<{
		data: any[];
		has_more: boolean;
	}> {
		return this.makeRequest<{
			data: any[];
			has_more: boolean;
		}>('GET', `/checkout/sessions?payment_intent=${paymentIntentId}&limit=${limit}`);
	}

	async getPaymentIntent(paymentIntentId: string): Promise<StripePaymentIntent> {
		return this.makeRequest<StripePaymentIntent>('GET', `/payment_intents/${paymentIntentId}`);
	}

	async findPaymentIntentByMemberAndProduct(
		memberId: string,
		productId: string,
	): Promise<{
		paymentIntent: StripePaymentIntent;
		productAmount: number;
		session: any;
	} | null> {
		try {
			this.logger.log(`Finding payment intent for memberId=${memberId}, productId=${productId}`);

			let hasMore = true;
			let startingAfter: string | undefined;

			while (hasMore) {
				const sessionsResponse = await this.makeRequest<{
					data: any[];
					has_more: boolean;
				}>('GET', `/checkout/sessions?limit=100${startingAfter ? `&starting_after=${startingAfter}` : ''}`);

				const sessions = sessionsResponse.data || [];

				for (const session of sessions) {
					if (session.metadata?.user_id !== memberId) continue;

					if (!session.payment_intent) continue;

					const expanded = await this.makeRequest<any>(
						'GET',
						`/checkout/sessions/${session.id}?expand[]=line_items.data.price.product`,
					);

					const lineItems = expanded.line_items?.data || [];

					for (const item of lineItems) {
						const itemProductId = typeof item.price?.product === 'string' ? item.price.product : item.price?.product?.id;

						if (itemProductId !== productId) continue;

						const paymentIntent = await this.getPaymentIntent(expanded.payment_intent);

						if (paymentIntent.status !== 'succeeded') continue;

						const amount = item.amount_total || item.price?.unit_amount * (item.quantity || 1) || 0;

						return {
							paymentIntent,
							productAmount: amount,
							session: expanded,
						};
					}
				}

				hasMore = sessionsResponse.has_more;
				startingAfter = sessions[sessions.length - 1]?.id;
			}

			this.logger.warn(`No payment found for memberId=${memberId}, productId=${productId}`);
			return null;
		} catch (error) {
			this.logger.error('findPaymentIntent failed', error);
			throw error;
		}
	}

	async createRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<any> {
		try {
			const paymentIntent = await this.getPaymentIntent(paymentIntentId);

			if (paymentIntent.status !== 'succeeded') {
				throw new BadRequestException(`Payment intent ${paymentIntentId} status is ${paymentIntent.status}, cannot refund`);
			}

			const charges = await this.makeRequest<{ data: any[] }>('GET', `/charges?payment_intent=${paymentIntentId}`);

			const charge = charges.data?.[0];
			if (!charge) {
				throw new BadRequestException(`No charges found for payment intent ${paymentIntentId}`);
			}

			if (charge.amount_refunded >= charge.amount) {
				throw new BadRequestException(`Charge ${charge.id} is already fully refunded`);
			}

			if (amount && amount > charge.amount - charge.amount_refunded) {
				throw new BadRequestException('Refund amount exceeds available balance');
			}

			return this.makeRequest<any>('POST', '/refunds', {
				charge: charge.id,
				amount,
				reason,
			});
		} catch (error) {
			this.logger.error(`Failed to create refund for payment intent ${paymentIntentId}`, error.stack);
			throw error;
		}
	}
}
