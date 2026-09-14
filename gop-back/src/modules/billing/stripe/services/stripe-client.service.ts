import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity } from '../entities/customer.entity';
import { INJECTION_TOKENS } from '../../../../common/constants';

@Injectable()
export class StripeClientService implements OnModuleInit {
	constructor(
		@Inject(INJECTION_TOKENS.STRIPE_CLIENT)
		private readonly stripe: Stripe,
		@InjectRepository(CustomerEntity)
		private customerRepository: Repository<CustomerEntity>,
	) {}

	async onModuleInit() {
		try {
			await this.stripe.accounts.retrieve();
			console.log('+ Stripe service connected successfully');
		} catch (error) {
			console.error('- Stripe service connection failed:', error.message);
			throw new Error('Stripe service is not available');
		}
	}

	getClient(): Stripe {
		return this.stripe;
	}

	async incrementRequestsCount(email: string): Promise<void> {
		await this.customerRepository.increment({ email }, 'requests_count', 1);
	}
}
