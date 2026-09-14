import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Orders, OrderStatusEnum, OrderTypeEnum } from '../entities/orders.entity';
import { IOneTimePaymentRecord, IRefundRecord, ISubscriptionInvoiceRecord } from '../types/order-record.types';
import { UserProductsService } from '../../user-products/services/user-products.service';
import { ProductPrices } from '../../user-products/entities/product-prices.entity';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class OrdersService {
	private readonly logger = new Logger(OrdersService.name);

	constructor(
		@InjectRepository(Orders)
		private readonly ordersRepo: Repository<Orders>,
		private readonly userProductsService: UserProductsService,
	) {}

	async recordOneTimePayment(record: IOneTimePaymentRecord): Promise<Orders | null> {
		try {
			// without it TypeORM drops the condition and findOne returns an arbitrary order, read as a duplicate
			if (!record.stripePaymentIntentId) {
				this.logger.warn('One-time payment without payment_intent — cannot deduplicate or match refunds, skipped');
				return null;
			}

			const existing: Orders | null = await this.ordersRepo.findOne({
				where: { stripePaymentIntent: record.stripePaymentIntentId },
			});

			if (existing) {
				return await this.enrichWithPrice(existing, record.stripePriceId);
			}

			const userId: string = await this.userProductsService.resolveUserId(record.userId, record.email);
			const price: ProductPrices | null = record.stripePriceId
				? await this.userProductsService.findPriceByStripeId(record.stripePriceId)
				: null;

			return await this.save({
				user: { id: userId },
				product: price?.product ?? null,
				price: price ?? null,
				amount: this.toMajorUnits(record.amountInCents),
				currency: this.normalizeCurrency(record.currency),
				type: OrderTypeEnum.ONE_TIME,
				status: OrderStatusEnum.PAID,
				stripePriceId: record.stripePriceId ?? null,
				stripePaymentIntent: record.stripePaymentIntentId,
				stripeInvoiceId: null,
				stripeSubscriptionId: null,
				stripeCustomerId: record.stripeCustomerId ?? null,
				purchaseUtmSource: record.utmSource ?? null,
				purchaseUtmMedium: record.utmMedium ?? null,
				purchaseUtmCampaign: record.utmCampaign ?? null,
				paidAt: this.toDate(record.paidAtUnix),
				refundedAt: null,
			});
		} catch (error) {
			this.logger.error(`recordOneTimePayment failed for payment_intent ${record.stripePaymentIntentId}: ${error?.message}`);
			return null;
		}
	}

	async recordSubscriptionInvoice(record: ISubscriptionInvoiceRecord): Promise<Orders | null> {
		try {
			if (!record.stripeInvoiceId) {
				this.logger.warn('Subscription invoice without id — cannot deduplicate, skipped');
				return null;
			}

			const existing: Orders | null = await this.ordersRepo.findOne({
				where: { stripeInvoiceId: record.stripeInvoiceId },
			});

			if (existing) {
				return await this.enrichWithPrice(existing, record.stripePriceId);
			}

			const userId: string = await this.userProductsService.resolveUserId(record.userId, record.email);
			const price: ProductPrices | null = record.stripePriceId
				? await this.userProductsService.findPriceByStripeId(record.stripePriceId)
				: null;

			return await this.save({
				user: { id: userId },
				product: price?.product ?? null,
				price: price ?? null,
				amount: this.toMajorUnits(record.amountInCents),
				currency: this.normalizeCurrency(record.currency),
				type: this.resolveSubscriptionType(record.billingReason),
				status: OrderStatusEnum.PAID,
				stripePriceId: record.stripePriceId ?? null,
				stripePaymentIntent: record.stripePaymentIntentId ?? null,
				stripeInvoiceId: record.stripeInvoiceId,
				stripeSubscriptionId: record.stripeSubscriptionId ?? null,
				stripeCustomerId: record.stripeCustomerId ?? null,
				purchaseUtmSource: record.utmSource ?? null,
				purchaseUtmMedium: record.utmMedium ?? null,
				purchaseUtmCampaign: record.utmCampaign ?? null,
				paidAt: this.toDate(record.paidAtUnix),
				refundedAt: null,
			});
		} catch (error) {
			this.logger.error(`recordSubscriptionInvoice failed for invoice ${record.stripeInvoiceId}: ${error?.message}`);
			return null;
		}
	}

	async applyRefund(record: IRefundRecord): Promise<Orders | null> {
		try {
			if (!record.stripePaymentIntentId) {
				this.logger.warn(`Refund ${record.stripeChargeId} has no payment_intent — no order to update`);
				return null;
			}

			const order: Orders | null = await this.ordersRepo.findOne({
				where: { stripePaymentIntent: record.stripePaymentIntentId },
			});

			if (!order) {
				this.logger.warn(`Refund ${record.stripeChargeId} — no order for payment_intent ${record.stripePaymentIntentId}`);
				return null;
			}

			const refundedAmount: number = this.toMajorUnits(record.amountRefundedInCents);
			const chargedAmount: number = this.toMajorUnits(record.amountInCents);

			order.refundedAmount = refundedAmount;
			order.status = refundedAmount >= chargedAmount ? OrderStatusEnum.REFUNDED : OrderStatusEnum.PARTIALLY_REFUNDED;
			order.refundedAt = this.toDate(record.refundedAtUnix);

			return await this.ordersRepo.save(order);
		} catch (error) {
			this.logger.error(`applyRefund failed for charge ${record.stripeChargeId}: ${error?.message}`);
			return null;
		}
	}

	// events for one purchase arrive in any order and carry different fields: the payment_intent often
	// has no price_id while the checkout session does, so whichever lands second fills the gap
	private async enrichWithPrice(order: Orders, stripePriceId?: string): Promise<Orders> {
		if (order.stripePriceId || !stripePriceId) return order;

		const price: ProductPrices | null = await this.userProductsService.findPriceByStripeId(stripePriceId);

		order.stripePriceId = stripePriceId;
		order.price = price ?? null;
		order.product = price?.product ?? null;

		return await this.ordersRepo.save(order);
	}

	private async save(data: DeepPartial<Orders>): Promise<Orders | null> {
		try {
			const order: Orders = this.ordersRepo.create(data);
			return await this.ordersRepo.save(order);
		} catch (error) {
			// concurrent webhook deliveries race on the same payment; the partial unique index wins, we just skip
			if (error?.code === UNIQUE_VIOLATION) {
				this.logger.log(`Order already recorded (unique violation): ${data.stripePaymentIntent ?? data.stripeInvoiceId}`);
				return null;
			}

			throw error;
		}
	}

	private resolveSubscriptionType(billingReason?: string): OrderTypeEnum {
		return billingReason === 'subscription_create' ? OrderTypeEnum.SUBSCRIPTION : OrderTypeEnum.RENEWAL;
	}

	private toMajorUnits(amountInCents: number): number {
		return Number(((amountInCents ?? 0) / 100).toFixed(2));
	}

	private normalizeCurrency(currency?: string): string {
		return (currency ?? 'usd').toUpperCase();
	}

	private toDate(unixTimestamp?: number): Date {
		return unixTimestamp ? new Date(unixTimestamp * 1000) : new Date();
	}
}
