// Stripe DTOs for API requests and responses
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { BaseTrackingDto } from './base-tracking.dto';

// Custom validator for URLs with Stripe placeholders
function IsStripeUrl(validationOptions?: ValidationOptions) {
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: 'isStripeUrl',
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: {
				validate(value: any, args: ValidationArguments) {
					if (typeof value !== 'string') return false;

					// Replace Stripe placeholders with test values for validation
					const testUrl = value
						.replace('{CHECKOUT_SESSION_ID}', 'cs_test_1234567890')
						.replace('{PAYMENT_INTENT_ID}', 'pi_test_1234567890');

					// Use built-in URL validation
					try {
						new URL(testUrl);
						return true;
					} catch {
						return false;
					}
				},
				defaultMessage(args: ValidationArguments) {
					return `${args.property} must be a valid URL (Stripe placeholders like {CHECKOUT_SESSION_ID} are allowed)`;
				},
			},
		});
	};
}

export class CreateCheckoutSessionWithTrackingDto extends BaseTrackingDto {
	@ApiPropertyOptional({ example: 'prod_1234567890' })
	@IsOptional()
	@IsString()
	product_id?: string;

	@ApiPropertyOptional({ example: 'price_1234567890' })
	@IsOptional()
	@IsString()
	price_id?: string;

	@ApiProperty({
		description: 'URL to redirect to after successful payment',
		example: 'http://localhost:4000/success.html?session_id={CHECKOUT_SESSION_ID}',
	})
	@IsStripeUrl()
	success_url: string;

	@ApiProperty({
		description: 'URL to redirect to after cancelled payment',
		example: 'http://localhost:4000/cancel.html',
	})
	@IsStripeUrl()
	cancel_url: string;

	@ApiPropertyOptional({
		description: 'Additional metadata (e.g., user_id, member_id)',
		type: 'object',
		example: { user_id: '50a39a23-b667-4f0f-8c20-68f25391cd95' },
	})
	@IsOptional()
	@IsObject()
	metadata?: Record<string, string>;

	@ApiPropertyOptional({
		description: 'Promotion code ID to apply discount',
		example: 'promo_1SGfHIABwKn0uHUMmBOMtufB',
	})
	@IsOptional()
	@IsString()
	promotion_code?: string;

	@ApiPropertyOptional({
		description: 'Coupon ID to apply discount',
		example: 'SUMMER20',
	})
	@IsOptional()
	@IsString()
	coupon?: string;

	@ApiPropertyOptional({
		description: 'Subscription data including trial period and metadata',
		example: { trial_period_days: 7, metadata: { user_id: '123' } },
		type: 'object',
	})
	@IsOptional()
	@IsObject()
	subscription_data?: {
		trial_period_days?: number;
		metadata?: Record<string, string>;
	};
}

export class CheckoutSessionResponseDto {
	@ApiProperty({
		description: 'Success status',
		example: true,
	})
	success: boolean;

	@ApiProperty({
		description: 'Stripe session ID',
		example: 'cs_test_1234567890',
	})
	session_id: string;

	@ApiProperty({
		description: 'Checkout URL',
		example: 'https://checkout.stripe.com/pay/cs_test_1234567890',
	})
	url: string;

	@ApiProperty({
		description: 'Full session object from Stripe',
		type: 'object',
	})
	session: any;
}

export class ErrorResponseDto {
	@ApiProperty({
		description: 'Success status',
		example: false,
	})
	success: boolean;

	@ApiProperty({
		description: 'Error message',
		example: 'Invalid request parameters',
	})
	error: string;
}

export class WebhookResponseDto {
	@ApiProperty({
		description: 'Webhook received status',
		example: true,
	})
	received: boolean;
}
