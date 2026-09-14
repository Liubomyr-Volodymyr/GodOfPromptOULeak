import { Controller, Post, Headers, Logger, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { StripeApiService } from '../services/stripe-api.service';
import { StripeWebhookService } from '../services/stripe-webhook.service';
import { ApiStripeWebhook } from '../docs/api-stripe-webhook.decorator';
import { LoggerService } from '../../../../infra/logger/services/logger.service';
import { StripePaymentWebhookService } from '../services/stripe-payment-webhook.service';
import { ActivityTypeEnum } from '../../../activity/enums/activity-type.enum';
import { UserActivityService } from '../../../activity/services/user-activity.service';

@ApiTags('Stripe Webhook')
@Controller('stripe')
export class StripeWebhookController {
	private readonly logger = new Logger(StripeWebhookController.name);

	constructor(
		private readonly stripeApiService: StripeApiService,
		private readonly stripeWebhookService: StripeWebhookService,
		private readonly loggerService: LoggerService,
		private readonly activityService: UserActivityService,
		private readonly stripePaymentWebhookService: StripePaymentWebhookService,
	) {}

	@Post('webhook')
	@ApiStripeWebhook()
	async handleWebhook(@Req() req: Request, @Headers('stripe-signature') signature: string) {
		let event: any;

		try {
			const rawBody = (req as any).rawBody as Buffer;
			event = this.stripeApiService.verifyWebhookSignature(rawBody, signature);
		} catch (error) {
			this.logger.error(`Webhook signature verification failed: ${error.message}`);
			this.loggerService.error({
				statusCode: 400,
				path: '/api/stripe/webhook',
				method: 'POST',
				message: `Stripe webhook signature error: ${error.message}`,
			});
			throw new BadRequestException('Invalid webhook signature');
		}

		this.logger.log(`[Stripe Webhook] ${event.type} (id=${event.id})`);

		await this.processEvent(event);

		return { received: true };
	}

	private async processEvent(event: any) {
		switch (event.type) {
			case 'checkout.session.completed':
				this.logger.log(
					`[Webhook] checkout.session.completed — session=${event.data.object?.id} mode=${event.data.object?.mode} subscription=${event.data.object?.subscription} payment_intent=${event.data.object?.payment_intent}`,
				);
				await this.stripeWebhookService.handleCheckoutSessionCompleted(event.data.object);
				break;
			case 'checkout.session.expired':
				this.logger.log(`Checkout session expired: ${event.data.object?.id}`);
				break;
			case 'payment_intent.succeeded': {
				const pi = event.data.object;

				await this.stripeWebhookService.handlePaymentIntentSucceeded(pi);

				this.activityService
					.track({
						user_id: pi.metadata?.user_id,
						user: pi.metadata?.user_id,
						type: ActivityTypeEnum.PURCHASE,
						path: 'stripe/webhook/payment_intent.succeeded',
						method: 'WEBHOOK',
						status: 200,
					})
					.catch((err) => this.logger.error(`activity.track failed for payment_intent.succeeded: ${err?.message}`));

				break;
			}
			case 'payment_intent.payment_failed': {
				const pi = event.data.object;

				this.activityService
					.track({
						user_id: pi.metadata?.user_id,
						user: pi.metadata?.user_id,
						type: ActivityTypeEnum.PURCHASE_FAILED,
						path: 'stripe/webhook/payment_intent.payment_failed',
						method: 'WEBHOOK',
						status: 400,
					})
					.catch((err) => this.logger.error(`activity.track failed for payment_intent.payment_failed: ${err?.message}`));

				break;
			}
			case 'customer.created':
				break;
			case 'invoice.payment_succeeded': {
				const invoice = event.data.object;

				await this.stripeWebhookService.handleInvoicePaymentSucceeded(invoice);

				if (invoice.amount_paid > 0) {
					this.activityService
						.track({
							user_id: invoice.metadata?.user_id,
							user: invoice.metadata?.user_id,
							type: ActivityTypeEnum.PURCHASE,
							path: 'stripe/webhook/invoice.payment_succeeded',
							method: 'WEBHOOK',
							status: 200,
						})
						.catch((err) => this.logger.error(`activity.track failed for invoice.payment_succeeded: ${err?.message}`));
				}

				break;
			}
			case 'invoice.payment_failed': {
				const invoice = event.data.object;

				await this.stripeWebhookService.handleInvoicePaymentFailed(invoice);

				this.activityService
					.track({
						user_id: invoice.metadata?.user_id,
						user: invoice.metadata?.user_id,
						type: ActivityTypeEnum.PURCHASE_FAILED,
						path: 'stripe/webhook/invoice.payment_failed',
						method: 'WEBHOOK',
						status: 400,
					})
					.catch((err) => this.logger.error(`activity.track failed for invoice.payment_failed: ${err?.message}`));

				break;
			}
			case 'customer.subscription.created': {
				const sub = event.data.object;

				await this.stripeWebhookService.handleSubscriptionCreated(sub);

				this.activityService
					.track({
						user_id: sub.metadata?.user_id,
						user: sub.metadata?.user_id,
						type: sub.status === 'trialing' ? ActivityTypeEnum.TRIAL_STARTED : ActivityTypeEnum.SUBSCRIPTION_STARTED,
						path: 'stripe/webhook/subscription.created',
						method: 'WEBHOOK',
						status: 200,
					})
					.catch((err) =>
						this.logger.error(
							`activity.track failed for subscription.created${sub.status === 'trialing' ? ' (trialing)' : ''}: ${err?.message}`,
						),
					);

				break;
			}
			case 'customer.subscription.updated':
				this.logger.log(
					`[Webhook] customer.subscription.updated — sub=${event.data.object?.id} status=${event.data.object?.status} prev_status=${event.data.previous_attributes?.status}`,
				);
				await this.stripeWebhookService.handleSubscriptionUpdated(event.data.object, event.data.previous_attributes);
				break;
			case 'customer.subscription.deleted': {
				const sub = event.data.object;

				await this.stripeWebhookService.handleSubscriptionDeleted(sub);

				this.activityService
					.track({
						user_id: sub.metadata?.user_id,
						user: sub.metadata?.user_id,
						type: ActivityTypeEnum.SUBSCRIPTION_CANCELED,
						path: 'stripe/webhook/subscription.deleted',
						method: 'WEBHOOK',
						status: 200,
					})
					.catch((err) => this.logger.error(`activity.track failed for subscription.deleted: ${err?.message}`));

				break;
			}
			case 'charge.refunded': {
				const charge = event.data.object;

				await this.stripeWebhookService.handleChargeRefunded(charge);

				this.activityService
					.track({
						user_id: charge.metadata?.user_id,
						user: charge.metadata?.user_id,
						type: ActivityTypeEnum.PURCHASE_REFUNDED,
						path: 'stripe/webhook/charge.refunded',
						method: 'WEBHOOK',
						status: 200,
					})
					.catch((err) => this.logger.error(`activity.track failed for charge.refunded: ${err?.message}`));

				break;
			}
			case 'setup_intent.succeeded':
				await this.stripePaymentWebhookService.handleSetupIntentSuccess(event.data.object);
				break;
			case 'charge.succeeded':
				if (event.data.object?.metadata?.task_id) {
					await this.stripePaymentWebhookService.proceedTask(event.data.object);
				} else {
					this.logger.log(`Charge succeeded: ${event.data.object?.id}`);
				}
				break;
			case 'charge.updated':
				this.logger.log(`Charge updated: ${event.data.object?.id}`);
				break;
			default:
				this.logger.log(`Unhandled event type: ${event.type}`);
		}
	}
}
