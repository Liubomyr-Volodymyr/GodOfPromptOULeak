import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { GeneratorAttrs } from '../../../generator/dto/generator.dto';
import { StripeSuccessDto } from '../dto/customer-checkout.dto';
import { CustomGeneratorService } from '../../../generator/services/custom-generator.service';
import { StripeClientService } from './stripe-client.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity } from '../entities/customer.entity';
import { StripePaymentsService } from './stripe-payments.service';
import { Ga4MeasurementProtocolService } from './ga4-mp.service';

@Injectable()
export class StripePaymentWebhookService {
	private readonly stripe: Stripe;
	private readonly FREE_REQUESTS_COUNT: number;

	constructor(
		@InjectRepository(CustomerEntity)
		private customerRepository: Repository<CustomerEntity>,
		private readonly stripeClientService: StripeClientService,
		private readonly stripePaymentsService: StripePaymentsService,
		private readonly customGeneratorService: CustomGeneratorService,
		private readonly ga4: Ga4MeasurementProtocolService,
	) {
		this.stripe = this.stripeClientService.getClient();
		this.FREE_REQUESTS_COUNT = Number(process.env.FREE_REQUESTS_COUNT) || 0;
	}

	async handleWebhook(signature: string, payload: Buffer): Promise<StripeSuccessDto> {
		try {
			const event = this.stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);

			const object = event.data.object as any;
			const webhookId = object.metadata?.webhook_id || object.setup_intent_data?.metadata?.webhook_id;

			if (webhookId !== process.env.APP_TITLE) {
				console.log('├── Skipping webhook - APP_TITLE mismatch');
				return { received: true };
			}

			switch (event.type) {
				case 'setup_intent.succeeded':
					console.log('├── Processing setup_intent.succeeded');
					const setupIntent = event?.data.object as Stripe.SetupIntent;
					return await this.handleSetupIntentSuccess(setupIntent);
				case 'charge.succeeded':
					console.log('├── Processing charge.succeeded');
					const charge = event?.data?.object as Stripe.Charge;
					return this.proceedTask(charge);
				case 'checkout.session.completed':
					if (this.FREE_REQUESTS_COUNT > 0) {
						const completedSession = event?.data?.object as any;

						console.log('├── Processing checkout.session.completed');
						if (completedSession.metadata?.is_setup === 'true') {
							return { received: true };
						}
						return this.proceedTask(completedSession as Stripe.Charge);
					}
			}

			return { received: true };
		} catch (error) {
			console.error('Webhook error:', error);
			if (error instanceof Stripe.errors.StripeError) {
				throw new Error(`Webhook Error: ${error.message}`);
			}
			throw error;
		}
	}

	async proceedTask(session: Stripe.Charge): Promise<StripeSuccessDto> {
		if (!session.metadata.email || !session.metadata.task_id) {
			console.error('Webhook Error: Missing required metadata fields', {
				receivedMetadata: session.metadata,
				sessionId: session.id,
			});
			return { received: true };
		}

		const taskData: GeneratorAttrs = {
			task_id: Number(session.metadata.task_id),
			spend: (session.amount || 0) / 100,
			event_id: session.payment_intent as string,
			country: session.billing_details?.address?.country || null,
		};
		await this.stripeClientService.incrementRequestsCount(session.metadata.email);
		void this.customGeneratorService.completeTask(taskData);

		return { received: true };
	}

	async handleSetupIntentSuccess(setupIntent: Stripe.SetupIntent): Promise<StripeSuccessDto> {
		if (!setupIntent.metadata?.email || !setupIntent.metadata?.task_id || !setupIntent.metadata?.member_id) {
			console.error('Missing required metadata in setupIntent', setupIntent.metadata);
			return { received: true };
		}

		await this.customerRepository.update({ stripe_customer_id: setupIntent.customer as string }, { card_verified: true });

		// GA4 generator_card_added — server-side, the source of truth (MADS
		// spec): the card-add happens on Stripe's domain where GTM is
		// CSP-blocked, so the browser cannot observe it. KEY generator-funnel
		// conversion. transaction_id = SetupIntent id (dedup key); user_id =
		// SHA-256(email) stitches generator_email_submitted →
		// generator_card_added → generator_paid_generation. No value param —
		// card verification captures no charge. Fire-and-forget.
		void this.ga4.send(
			'generator_card_added',
			{
				transaction_id: setupIntent.id,
				...(typeof setupIntent.payment_method === 'string'
					? { payment_method_id: setupIntent.payment_method }
					: setupIntent.payment_method?.id
						? { payment_method_id: setupIntent.payment_method.id }
						: {}),
				...(setupIntent.metadata?.goal_category ? { goal_category: setupIntent.metadata.goal_category } : {}),
			},
			{ seed: setupIntent.id, userId: this.ga4.hashEmail(setupIntent.metadata.email) },
		);

		try {
			const customer = await this.customerRepository.findOne({
				where: {
					stripe_customer_id: setupIntent.customer as string,
				},
			});

			if (customer) {
				const price = await this.stripe.prices.retrieve(process.env.STRIPE_PRICE_ID);

				await this.stripePaymentsService.createPaymentIntent(
					customer,
					price.unit_amount,
					{
						email: setupIntent.metadata.email,
						task_id: Number(setupIntent.metadata.task_id),
						member_id: setupIntent.metadata.member_id,
					},
					price,
				);
			}
		} catch (error) {
			console.error('Error in handleSetupIntentSuccess:', error);
		}

		return { received: true };
	}
}
