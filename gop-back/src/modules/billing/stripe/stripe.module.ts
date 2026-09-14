import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { StripeApiService } from './services/stripe-api.service';
import { ReferralTrackingService } from './services/referral-tracking.service';
import { StripeService } from './services/stripe.service';
import { StripeWebhookService } from './services/stripe-webhook.service';
import { StripeClientService } from './services/stripe-client.service';
import { StripePaymentsService } from './services/stripe-payments.service';
import { StripePaymentWebhookService } from './services/stripe-payment-webhook.service';
import { Ga4MeasurementProtocolService } from './services/ga4-mp.service';
import { StripeWebhookController } from './controllers/stripe-webhook.controller';
import { StripeController } from './controllers/stripe.controller';
import { StripeCheckoutController } from './controllers/stripe-checkout.controller';
import { CustomerEntity } from './entities/customer.entity';
import { LoggerModule } from '../../../infra/logger/logger.module';
import { UserProductsModule } from '../../user-products/user-products.module';
import { OrdersModule } from '../../orders/orders.module';
import { ActivityModule } from '../../activity/activity.module';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import { GeneratorModule } from '../../generator/generator.module';
import { StripeModule as StripeClientModule } from '../../../infra/stripe/stripe.module';

@Module({
	imports: [
		HttpModule,
		ConfigModule,
		LoggerModule,
		StripeClientModule,
		UserProductsModule,
		OrdersModule,
		ActivityModule,
		TypeOrmModule.forFeature([CustomerEntity]),
		PassportModule,
		AuthModule,
		UsersModule,
		forwardRef(() => GeneratorModule),
	],
	providers: [
		StripeApiService,
		ReferralTrackingService,
		StripeService,
		StripeWebhookService,
		StripeClientService,
		StripePaymentsService,
		StripePaymentWebhookService,
		Ga4MeasurementProtocolService,
	],
	controllers: [StripeWebhookController, StripeController, StripeCheckoutController],
	exports: [StripeApiService, StripeService, ReferralTrackingService, StripePaymentsService, StripePaymentWebhookService],
})
export class StripeModule {}
