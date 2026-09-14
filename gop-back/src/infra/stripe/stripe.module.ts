import { Module } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { CONFIG } from '../../config/enums';
import { INJECTION_TOKENS } from '../../common/constants';

@Module({
	providers: [
		{
			provide: INJECTION_TOKENS.STRIPE_CLIENT,
			inject: [ConfigService],
			useFactory: (config: ConfigService) => {
				return new Stripe(config.getOrThrow(CONFIG.STRIPE_SECRET_KEY), {
					apiVersion: '2025-02-24.acacia',
				});
			},
		},
	],
	exports: [INJECTION_TOKENS.STRIPE_CLIENT],
})
export class StripeModule {}
