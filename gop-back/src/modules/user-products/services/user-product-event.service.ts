import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeepPartial } from 'typeorm';
import { UserProductsService } from './user-products.service';
import { SegmentsService } from '../../segments/segments.service';
import { MailerService } from '../../../infra/mailer/services/mailer.service';
import { CONFIG } from '../../../config/enums';
import { ProductData } from '../types';
import { ProductAccessEnum, ProductStatusEnum, UserProducts } from '../entities/user-products.entity';
import { ProductPrices } from '../entities/product-prices.entity';
import {
	AdminProductsUpdateEventDto,
	PurchaseCompletedEventDto,
	RefundEventDto,
	SubscriptionCreatedEventDto,
	SubscriptionTerminatedEventDto,
	SubscriptionUpdatedEventDto,
	TrialEndedEventDto,
} from '../dto';
import pLimit from 'p-limit';
import { SegmentsEnum } from '../../segments/segments.enum';

@Injectable()
export class UserProductEventService {
	private readonly logger = new Logger(UserProductEventService.name);

	constructor(
		private readonly userProducts: UserProductsService,
		private readonly segments: SegmentsService,
		private readonly mailer: MailerService,
		private readonly configService: ConfigService,
	) {}

	async handleSubscriptionCreated(dto: SubscriptionCreatedEventDto): Promise<void> {
		this.logger.log(`[Subscription] created sub=${dto.subscription_id} price=${dto.price_id ?? dto.metadata?.price_id}`);
		const userId = await this.userProducts.resolveUserId(dto.metadata?.user_id, dto.metadata?.email);

		const priceId = dto.price_id ?? dto.metadata?.price_id;
		const price = await this.userProducts.findPriceByStripeId(priceId!);
		if (!price) {
			this.logger.warn(`Price not found for stripe_price_id: ${priceId}`);
			return;
		}

		if (dto.customer_id) {
			await this.userProducts.updateUserStripeId(userId, dto.customer_id).catch((err) => {
				this.logger.error(`Failed to update stripe_customer_id for user ${userId}: ${err}`);
			});
		}

		const status = dto.status;
		const data: DeepPartial<UserProducts> = {
			user: userId as any,
			product: price.product.id as any,
			price: price.id as any,
			status: this.userProducts.mapStatus(status),
			accessType: this.userProducts.mapAccessType(status),
			grantedAt: this.userProducts.toIso(dto.current_period_start),
			expiresAt: this.userProducts.toIso(dto.current_period_end),
			stripeSubscriptionId: dto.subscription_id,
			paymentIntent: dto.payment_intent,
			purchaseUtmSource: dto.utm_source ?? dto.metadata?.utm_source,
			purchaseUtmMedium: dto.utm_medium ?? dto.metadata?.utm_medium,
			purchaseUtmCampaign: dto.utm_campaign ?? dto.metadata?.utm_campaign,
		};

		const existingUserProduct = await this.userProducts.findBySubscriptionId(dto.subscription_id);
		if (existingUserProduct) {
			this.logger.log(`Subscription already exists: ${dto.subscription_id}, updating`);
			await this.userProducts.update(existingUserProduct.id, data);
		} else {
			await this.userProducts.create(data);
			this.logger.log(`Created user_product for subscription ${dto.subscription_id}`);

			await this.sendDeliveryNotification(userId, price.product);

			await this.applySegmentsForNewProduct(userId, price, status, {
				utmSource: dto.utm_source ?? dto.metadata?.utm_source,
				utmMedium: dto.utm_medium ?? dto.metadata?.utm_medium,
				utmCampaign: dto.utm_campaign ?? dto.metadata?.utm_campaign,
			});
		}
	}

	async handlePurchaseCompleted(event: PurchaseCompletedEventDto): Promise<void> {
		this.logger.log(`[LOG] purchase completed pi=${event.payment_intent_id} price=${event.price_id ?? event.metadata?.price_id}`);
		const userId = await this.userProducts.resolveUserId(
			event.user_id ?? event.metadata?.user_id,
			event.email ?? event.metadata?.email,
		);

		const priceId = event.price_id ?? event.metadata?.price_id;
		const price = await this.userProducts.findPriceByStripeId(priceId!);
		if (!price) {
			this.logger.warn(`Price not found for stripe_price_id: ${priceId}`);
			return;
		}

		if (event.customer_id) {
			await this.userProducts.updateUserStripeId(userId, event.customer_id).catch((err) => {
				this.logger.error(`Failed to update stripe_customer_id for user ${userId}: ${err}`);
			});
		}

		const status = event.status === 'paid' ? 'active' : event.status;

		const data: DeepPartial<UserProducts> = {
			user: { id: userId } as any,
			product: price.product,
			price: price,
			status: this.userProducts.mapStatus(status),
			accessType: this.userProducts.mapAccessType(status),
			stripeOneTimePurchaseId: event.payment_intent_id,
			paymentIntent: event.payment_intent_id,
			purchaseUtmSource: event.utm_source ?? event.metadata?.utm_source,
			purchaseUtmMedium: event.utm_medium ?? event.metadata?.utm_medium,
			purchaseUtmCampaign: event.utm_campaign ?? event.metadata?.utm_campaign,
		};

		const existingUserProduct = event.payment_intent_id ? await this.userProducts.findByPaymentIntentId(event.payment_intent_id) : null;
		if (existingUserProduct) {
			this.logger.log(`Purchase already exists: ${event.payment_intent_id}, updating`);
			await this.userProducts.update(existingUserProduct.id, data);
		} else {
			await this.userProducts.create(data);
			this.logger.log(`[User product] Created for purchase ${event.payment_intent_id}`);

			await this.sendDeliveryNotification(userId, price.product);

			await this.applySegmentsForNewProduct(userId, price, status, {
				utmSource: event.utm_source ?? event.metadata?.utm_source,
				utmMedium: event.utm_medium ?? event.metadata?.utm_medium,
				utmCampaign: event.utm_campaign ?? event.metadata?.utm_campaign,
			});
		}
	}

	async handleSubscriptionUpdated(event: SubscriptionUpdatedEventDto): Promise<void> {
		const priceId = event.price_id ?? event.metadata?.price_id;
		await this.applySubscriptionUpdate(
			event.subscription_id,
			priceId!,
			event.status,
			event.current_period_start,
			event.current_period_end,
		);
	}

	async handleSubscriptionTerminated(event: SubscriptionTerminatedEventDto): Promise<void> {
		const record = await this.userProducts.findBySubscriptionId(event.subscription_id);
		if (!record) {
			this.logger.warn(`No user_product found for subscription ${event.subscription_id}`);
			return;
		}

		if (record.status === ProductStatusEnum.INACTIVE) {
			this.logger.log(`user_product ${record.id} already inactive for sub ${event.subscription_id}, skipping`);
			return;
		}

		const expiresAt = this.userProducts.toIso(event.canceled_at);
		await this.userProducts.update(record.id, {
			status: ProductStatusEnum.INACTIVE,
			...(expiresAt && { expires_at: expiresAt }),
		});

		this.logger.log(`Deactivated user_product ${record.id} for subscription ${event.subscription_id}`);

		await this.applyChurnedSegment(record.user.id);
	}

	async handleTrialStarted(event: {
		customer_id: string;
		subscription_id: string;
		status: string;
		trial_start: number;
		trial_end: number;
		metadata?: Record<string, string>;
	}): Promise<void> {
		this.logger.log(`[LOG] trial_started sub=${event.subscription_id}`);

		const record = await this.userProducts.findBySubscriptionId(event.subscription_id);

		if (record) {
			if (record.status === 'active') {
				this.logger.log(`Trial already active for subscription ${event.subscription_id}`);
				return;
			}

			await this.userProducts.update(record.id, {
				status: ProductStatusEnum.ACTIVE,
				accessType: ProductAccessEnum.TRIAL,
				grantedAt: this.userProducts.toIso(event.trial_start),
				expiresAt: this.userProducts.toIso(event.trial_end),
			});

			this.logger.log(`Activated existing user_product for subscription ${event.subscription_id}`);
			return;
		}

		const priceId = event.metadata?.price_id;
		const price = priceId ? await this.userProducts.findPriceByStripeId(priceId) : undefined;

		const data: DeepPartial<UserProducts> = {
			user: { id: event.customer_id } as any,
			product: price!.product,
			price: price!,
			status: ProductStatusEnum.ACTIVE,
			accessType: ProductAccessEnum.TRIAL,
			grantedAt: this.userProducts.toIso(event.trial_start),
			expiresAt: this.userProducts.toIso(event.trial_end),
			stripeSubscriptionId: event.subscription_id,
		};

		await this.userProducts.create(data);
		this.logger.log(`Created user_product for trial subscription ${event.subscription_id}`);
	}

	async handleTrialEnded(event: TrialEndedEventDto): Promise<void> {
		this.logger.log(`[LOG] trial_ended sub=${event.subscription_id}`);
		const record = await this.userProducts.findBySubscriptionId(event.subscription_id);
		if (!record) {
			this.logger.warn(`No user_product found for subscription ${event.subscription_id}`);
			return;
		}

		await this.userProducts.update(record.id, { status: ProductStatusEnum.INACTIVE });
		this.logger.log(`Trial ended — deactivated user_product for subscription ${event.subscription_id}`);
	}

	async handleRefund(dto: RefundEventDto): Promise<void> {
		if (dto.product_id) {
			const record: UserProducts = await this.userProducts.findByRecordId(dto.product_id);

			if (!record) {
				this.logger.warn(`Refund ${dto.charge_id} — user_product ${dto.product_id} not found`);
				return;
			}
			await this.userProducts.update(record.id, { status: ProductStatusEnum.INACTIVE });
			this.logger.log(`Refund — deactivated user_product ${record.id}`);

			await this.applyRefundedSegment(record.user.id);
			return;
		}

		const priceId: string = dto.metadata?.price_id ?? dto.price_id;
		if (!priceId) {
			this.logger.warn(`Refund ${dto.charge_id} — no price_id in metadata`);
			return;
		}

		let userId: string;
		try {
			userId = await this.userProducts.resolveUserId(dto.metadata?.user_id, dto.metadata?.email);
		} catch (err) {
			throw new Error(
				`Cannot resolve user for refund ${dto.charge_id} ` +
					`(customer=${dto.customer_id}): ${err.message}. ` +
					`Add user_id to charge metadata in Stripe and retry.`,
			);
		}

		const price: ProductPrices = await this.userProducts.findPriceByStripeId(priceId);
		if (!price) {
			this.logger.warn(`Refund ${dto.charge_id} — price not found for stripe_price_id: ${priceId}`);
			return;
		}

		const records: UserProducts[] = await this.userProducts.findByUserAndProductPrice(userId, price.product.id, price.id);
		if (!records.length) {
			this.logger.warn(`Refund ${dto.charge_id} — no user_products found for user ${userId}`);

			if (dto.payment_intent_id) {
				const record = await this.userProducts.findByPaymentIntentId(dto.payment_intent_id);
				if (record) {
					await this.userProducts.update(record.id, { status: ProductStatusEnum.INACTIVE });
					this.logger.log(`Refund — deactivated user_product ${record.id} via payment_intent_id fallback`);
					await this.applyRefundedSegment(record.user.id);
				} else {
					this.logger.warn(
						`Refund ${dto.charge_id} — no user_product found via payment_intent_id ${dto.payment_intent_id} either`,
					);
				}
			}

			return;
		}

		await Promise.all(records.map((r) => this.userProducts.update(r.id, { status: ProductStatusEnum.INACTIVE })));
		this.logger.log(`Refund — deactivated ${records.length} user_product(s) for user ${userId}`);

		await this.applyRefundedSegment(userId);
	}

	async handleAdminProductsUpdate(event: AdminProductsUpdateEventDto): Promise<void> {
		try {
			const [currentRecords, prices] = await Promise.all([
				this.userProducts.findAllByUser(event.userId),
				this.userProducts.findPricesByNames(event.price_names),
			]);

			const currentMap = new Map<string, UserProducts>();
			const noPriceRecords: UserProducts[] = [];

			for (const record of currentRecords) {
				const priceId = typeof record.price !== 'string' ? record.price?.id : record.price;

				if (!priceId) {
					noPriceRecords.push(record);
					continue;
				}

				currentMap.set(priceId, record);
			}

			await Promise.all(noPriceRecords.map((r) => this.userProducts.delete(r.id)));

			const desiredMap = new Map<string, ProductPrices>();
			for (const price of prices) {
				desiredMap.set(price.id, price);
			}

			const toAdd = [...desiredMap.keys()].filter((id) => !currentMap.has(id));
			const toRemove = [...currentMap.keys()].filter((id) => {
				const record = currentMap.get(id);
				if (!record) return false;
				if (record.stripeSubscriptionId || record.stripeOneTimePurchaseId) return false;

				return !desiredMap.has(id);
			});

			await this.applyAdds(event.userId, toAdd, desiredMap);
			await this.applyRemovals(toRemove, currentMap);
		} catch (err) {
			this.logger.error(err);
			throw err;
		}
	}

	private async applyAdds(userId: string, toAdd: string[], desiredMap: Map<string, ProductPrices>): Promise<void> {
		const limit = pLimit(5);

		await Promise.all(
			toAdd.map((priceId) =>
				limit(async () => {
					const price = desiredMap.get(priceId);
					if (!price) return;

					try {
						await this.retry(async () => {
							await this.userProducts.create({
								user: { id: userId } as any,
								product: price.product,
								price: price,
								status: ProductStatusEnum.ACTIVE,
								accessType: ProductAccessEnum.FULL,
							});
						});

						this.logger.log(`[AdminUpdate] Added product ${priceId} to user ${userId}`);

						await this.applySegmentsForNewProduct(userId, price, 'active').catch((err) => {
							this.logger.error(`Segments failed for ${priceId}: ${err}`);
						});
					} catch (err) {
						this.logger.error(`Failed to add product ${priceId}: ${err}`);
						throw new InternalServerErrorException(`Failed to add product ${priceId}`);
					}
				}),
			),
		);
	}

	private async applyRemovals(toRemove: string[], currentMap: Map<string, UserProducts>): Promise<void> {
		const limit = pLimit(5);

		await Promise.all(
			toRemove.map((priceId) =>
				limit(async () => {
					const record = currentMap.get(priceId);
					if (!record) return;

					const priceObj = typeof record.price === 'object' ? record.price : null;

					if (priceObj?.priceType === 'recurring') {
						this.logger.log(`[AdminUpdate] Skip subscription removal ${priceId}`);
						return;
					}

					try {
						await this.retry(async () => {
							await this.userProducts.delete(record.id);
						});

						this.logger.log(`[AdminUpdate] Removed product ${priceId}`);
					} catch (err) {
						this.logger.error(`Failed to remove product ${priceId}: ${err}`);
						throw new InternalServerErrorException(`Failed to remove product ${priceId}`);
					}
				}),
			),
		);
	}

	private async retry<T>(fn: () => Promise<T>, retries = 3, delay = 300): Promise<T> {
		try {
			return await fn();
		} catch (err) {
			if (retries <= 0) throw err;

			await new Promise((res) => setTimeout(res, delay));
			return this.retry(fn, retries - 1, delay * 2);
		}
	}

	private async applySubscriptionUpdate(
		subscriptionId: string,
		stripePriceId: string,
		status: string,
		periodStart?: number,
		periodEnd?: number,
	): Promise<void> {
		const record = await this.userProducts.findBySubscriptionId(subscriptionId);
		if (!record) {
			throw new Error(
				`No user_product found for subscription ${subscriptionId}. ` +
					`subscription.created may have been missed — check Stripe dashboard and retry.`,
			);
		}

		const oldPriceId = typeof record.price === 'object' ? record.price.id : record.price;

		const price = await this.userProducts.findPriceByStripeId(stripePriceId);
		if (!price) {
			this.logger.warn(`Price not found for stripe_price_id: ${stripePriceId}`);
			return;
		}

		await this.userProducts.update(record.id, {
			product: price.product,
			price,
			status: this.userProducts.mapStatus(status),
			accessType: this.userProducts.mapAccessType(status),
			...(periodStart && { granted_at: this.userProducts.toIso(periodStart) }),
			...(periodEnd && { expires_at: this.userProducts.toIso(periodEnd) }),
		});

		this.logger.log(`Updated user_product ${record.id} → price ${price.id}, status ${status}`);

		const userId = record.user.id;

		if (oldPriceId && oldPriceId !== price.id) {
			let oldPrice: ProductPrices | null = null;
			try {
				oldPrice = await this.userProducts.findPriceByStripeId(oldPriceId);
			} catch (err: unknown) {
				this.logger.warn(`Could not find old price ${oldPriceId} for segment removal: ${err}`);
			}
			if (oldPrice?.productPriceName) {
				await this.segments.removeUserFromSegmentByName(userId, oldPrice?.productPriceName).catch((err: unknown) => {
					this.logger.error(`Failed to remove old segment for user ${userId}: ${err}`);
				});
			}
		}

		await this.applySegmentsForNewProduct(userId, price, status).catch((err) => {
			this.logger.error(`Failed to apply segments on subscription update for user ${userId}: ${err}`);
		});
	}

	private async sendDeliveryNotification(userId: string, product: ProductData): Promise<void> {
		const templateId = this.configService.get<number>(CONFIG.POSTMARK_TEMPLATE_DELIVERY_NOTIFICATION);
		if (!templateId) {
			this.logger.warn('POSTMARK_TEMPLATE_DELIVERY_NOTIFICATION not set — skipping delivery notification');
			return;
		}

		try {
			const email = await this.userProducts.getUserEmail(userId);
			if (!email) {
				this.logger.warn(`No email found for user ${userId} — skipping delivery notification`);
				return;
			}

			const notionUrl = product.notion_product_access_url ?? null;
			const imageLink = product.image_link ?? null;

			await this.mailer.sendMailByTemplateId({
				to: email,
				templateId,
				context: {
					product_name: product.name,
					notion_url: notionUrl,
					image_link: imageLink,
				},
			});
			this.logger.log(`Delivery notification sent to ${email} for product: ${product.name}`);
		} catch (err) {
			this.logger.error(`Failed to send delivery notification for user ${userId}: ${err}`);
		}
	}

	private async applySegmentsForNewProduct(
		userId: string,
		price: ProductPrices,
		status: string,
		utmOpts?: { utmSource?: string; utmMedium?: string; utmCampaign?: string },
	): Promise<void> {
		try {
			const segmentId = await this.segments.getOrCreateSegment(price);
			await this.segments.addUserToSegment(userId, segmentId, utmOpts);
		} catch (err) {
			this.logger.error(`Failed to apply product segment for user ${userId}: ${err}`);
		}

		await this.segments.handleTrialAndFreeSegments(userId, status, utmOpts).catch((err) => {
			this.logger.error(`Failed to handle trial/free segments for user ${userId}: ${err}`);
		});
	}

	private async applyChurnedSegment(userId: string): Promise<void> {
		try {
			const segmentId = await this.segments.getOrCreateSegmentByName(
				SegmentsEnum.GOP_CHURNED,
				'Users whose subscriptions were canceled',
			);
			await this.segments.addUserToSegment(userId, segmentId);
		} catch (err) {
			this.logger.error(`Failed to add user ${userId} to gop-churned: ${err}`);
		}
	}

	private async applyRefundedSegment(userId: string): Promise<void> {
		try {
			const segmentId = await this.segments.getOrCreateSegmentByName(SegmentsEnum.GOP_REFUNDED, 'Users who received refunds');
			await this.segments.addUserToSegment(userId, segmentId);
		} catch (err) {
			this.logger.error(`Failed to add user ${userId} to gop-refunded: ${err}`);
		}
	}
}
