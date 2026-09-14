import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { CheckoutSessionAttrs, CheckoutSessionDto, StripeMetadataDto } from '../dto/customer-checkout.dto';
import { CustomGeneratorService } from '../../../generator/services/custom-generator.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity } from '../entities/customer.entity';
import { StripeClientService } from './stripe-client.service';
import { GeneratorAttrs } from '../../../generator/dto/generator.dto';
import { UsersService } from '../../../users/services/users.service';

@Injectable()
export class StripePaymentsService {
	private readonly stripe: Stripe;
	private readonly FREE_REQUESTS_COUNT: number;

	constructor(
		@InjectRepository(CustomerEntity)
		private customerRepository: Repository<CustomerEntity>,
		private readonly stripeClientService: StripeClientService,
		private readonly customGeneratorService: CustomGeneratorService,
		private readonly usersService: UsersService,
	) {
		this.stripe = this.stripeClientService.getClient();
		this.FREE_REQUESTS_COUNT = Number(process.env.FREE_REQUESTS_COUNT) || 0;
	}

	async createCheckoutSession(dataDto: CheckoutSessionAttrs): Promise<CheckoutSessionDto> {
		try {
			let customer = await this.customerRepository.findOne({
				where: { email: dataDto.email },
			});

			const taskDB = await this.customGeneratorService.dbCreateTask({
				email: dataDto.email,
				task: dataDto.task,
				prompt_type: dataDto.prompt_type,
			});

			const user = await this.usersService.findUserByEmail(dataDto.email);
			const isPremium = user ? await this.usersService.checkIsUserPremium(user.id) : false;

			if (isPremium) {
				void this.customGeneratorService.completeTask({
					task_id: taskDB.task_id,
					spend: 0,
					event_id: `premium_request_${Date.now()}`,
					country: null,
				});
				return { url: process.env.STRIPE_SUCCESS_URL, task_id: taskDB.task_id };
			}

			const requestsCount = customer?.requests_count ?? 0;
			if (this.FREE_REQUESTS_COUNT > 0 && requestsCount < this.FREE_REQUESTS_COUNT) {
				if (!customer) {
					customer = await this.findOrCreateCustomer(dataDto.email);
				}
				return await this.handleFreeRequest({
					email: dataDto.email,
					task_id: taskDB.task_id,
					member_id: dataDto.member_id,
				});
			}

			if (!customer || !customer.card_verified) {
				return await this.createSetupSession(customer, {
					email: dataDto.email,
					task_id: taskDB.task_id,
					member_id: dataDto.member_id,
				});
			}

			return await this.handlePaidRequest(customer, {
				email: dataDto.email,
				task_id: taskDB.task_id,
				member_id: dataDto.member_id,
			});
		} catch (error) {
			if (error instanceof Stripe.errors.StripeError) {
				throw new Error(`Failed to process payment: ${error.message}`);
			}
			throw error;
		}
	}

	private async createSetupSession(customer: CustomerEntity | null, dataDto: StripeMetadataDto): Promise<CheckoutSessionDto> {
		let stripeCustomerId = customer?.stripe_customer_id;

		if (stripeCustomerId) {
			try {
				const existing = await this.stripe.customers.retrieve(stripeCustomerId);
				if ('deleted' in existing && existing.deleted) {
					console.warn(`[Stripe] Customer ${stripeCustomerId} is deleted, recreating for ${dataDto.email}`);
					stripeCustomerId = null;
				}
			} catch {
				console.warn(`[Stripe] Customer ${stripeCustomerId} not found, recreating for ${dataDto.email}`);
				stripeCustomerId = null;
			}
		}

		if (!stripeCustomerId) {
			const stripeCustomers = await this.stripe.customers.list({
				email: dataDto.email,
				limit: 1,
			});

			stripeCustomerId = stripeCustomers.data[0]?.id || (await this.stripe.customers.create({ email: dataDto.email })).id;

			if (customer) {
				await this.customerRepository.update(
					{ customer_id: customer.customer_id },
					{ stripe_customer_id: stripeCustomerId, card_verified: false },
				);
				customer.stripe_customer_id = stripeCustomerId;
				customer.card_verified = false;
			} else {
				customer = await this.customerRepository.save(
					this.customerRepository.create({
						email: dataDto.email,
						stripe_customer_id: stripeCustomerId,
					}),
				);
			}
		}

		const metadata = {
			email: dataDto.email,
			task_id: dataDto.task_id,
			member_id: dataDto.member_id,
			webhook_id: process.env.APP_TITLE,
		};
		const session = await this.stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			mode: 'setup',
			customer: stripeCustomerId,
			success_url: `${process.env.STRIPE_SUCCESS_URL}`,
			cancel_url: `${process.env.STRIPE_CANCEL_URL}`,
			metadata: {
				...metadata,
				is_setup: 'true',
			},
			setup_intent_data: {
				metadata,
			},
		});

		return { url: session.url, task_id: dataDto.task_id };
	}

	private async findOrCreateCustomer(email: string): Promise<CustomerEntity> {
		const stripeCustomers = await this.stripe.customers.list({ email, limit: 1 });
		const stripeCustomerId = stripeCustomers.data[0]?.id || (await this.stripe.customers.create({ email })).id;
		return this.customerRepository.save(this.customerRepository.create({ email, stripe_customer_id: stripeCustomerId }));
	}

	private async handleFreeRequest(dataDto: StripeMetadataDto): Promise<CheckoutSessionDto> {
		await this.stripeClientService.incrementRequestsCount(dataDto.email);

		const taskData: GeneratorAttrs = {
			task_id: dataDto.task_id,
			spend: 0,
			event_id: `free_request_${Date.now()}`,
			country: null,
		};
		void this.customGeneratorService.completeTask(taskData);

		return { url: process.env.STRIPE_SUCCESS_URL, task_id: dataDto.task_id };
	}

	private async handlePaidRequest(customer: CustomerEntity, dataDto: StripeMetadataDto): Promise<CheckoutSessionDto> {
		try {
			const price = await this.stripe.prices.retrieve(process.env.STRIPE_PRICE_ID, { expand: ['product'] });

			const user = await this.usersService.findUserByEmail(dataDto.email);

			await this.createPaymentIntent(
				customer,
				price.unit_amount,
				{
					email: dataDto.email,
					task_id: dataDto.task_id,
					member_id: dataDto.member_id,
				},
				price,
				user,
			);

			return { url: process.env.STRIPE_SUCCESS_URL, task_id: dataDto.task_id };
		} catch (error) {
			if (this.isNoSuchCustomerError(error)) {
				console.warn(`[Stripe] customer ${customer.stripe_customer_id} for ${dataDto.email}, recreating...`);
				const refreshed = await this.recreateStripeCustomer(customer);
				return this.createSetupSession(refreshed, dataDto);
			}
			console.error('Automatic payment failed:', error);
			throw error;
		}
	}

	private isNoSuchCustomerError(error: any): boolean {
		const msg = error?.message || '';
		return msg.includes('No such customer') || error?.code === 'resource_missing';
	}

	private async recreateStripeCustomer(customer: CustomerEntity): Promise<CustomerEntity> {
		const newStripeCustomer = await this.stripe.customers.create({ email: customer.email });
		await this.customerRepository.update(
			{ customer_id: customer.customer_id },
			{ stripe_customer_id: newStripeCustomer.id, card_verified: false },
		);
		customer.stripe_customer_id = newStripeCustomer.id;
		customer.card_verified = false;
		return customer;
	}

	async createPaymentIntent(
		customer: CustomerEntity,
		amount: number,
		metadata: StripeMetadataDto,
		price?: Stripe.Price,
		user?: any,
	): Promise<string> {
		const startTime = Date.now();
		try {
			const paymentMethods = await this.stripe.paymentMethods.list({
				customer: customer.stripe_customer_id,
				type: 'card',
			});
			if (!paymentMethods.data.length) {
				throw new Error('No saved payment method found');
			}

			const paymentIntent = await this.stripe.paymentIntents.create({
				amount,
				currency: 'usd',
				customer: customer.stripe_customer_id,
				payment_method: paymentMethods.data[0].id,
				off_session: true,
				confirm: true,
				metadata: {
					...metadata,
					// the orders log reads price_id off the intent; without it the purchase lands with no product
					...(price ? { price_id: price.id } : {}),
					webhook_id: process.env.APP_TITLE,
				},
			});
			if (paymentIntent.last_payment_error) {
				console.log('├─ [PaymentIntent] Error:', paymentIntent.last_payment_error.message);
			}

			return paymentIntent.id;
		} catch (error) {
			console.error(`├─ [PaymentIntent] Error after ${Date.now() - startTime}ms:`, error.message);
			throw new Error(`Payment failed: ${error.message}`);
		}
	}
}
