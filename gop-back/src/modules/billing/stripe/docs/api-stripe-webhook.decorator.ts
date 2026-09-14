import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { ApiResponse } from '@nestjs/swagger';
import { WebhookResponseDto } from '../dto/stripe.dto';
import { ErrorResponseDto } from '../dto/stripe.dto';

export const ApiStripeWebhook = () => {
	return applyDecorators(
		ApiOperation({
			summary: 'Handle Stripe webhook events',
			description: 'Process incoming webhook events from Stripe for payment processing and tracking',
		}),
		ApiBody({
			type: 'object',
			description: 'Stripe webhook payload',
			examples: {
				'checkout.session.completed': {
					summary: 'Checkout session completed',
					value: {
						id: 'evt_1234567890',
						object: 'event',
						type: 'checkout.session.completed',
						data: {
							object: {
								id: 'cs_test_1234567890',
								object: 'checkout.session',
								payment_status: 'paid',
							},
						},
					},
				},
				'payment_intent.succeeded': {
					summary: 'Payment intent succeeded',
					value: {
						id: 'evt_1234567890',
						object: 'event',
						type: 'payment_intent.succeeded',
						data: {
							object: {
								id: 'pi_1234567890',
								object: 'payment_intent',
								status: 'succeeded',
							},
						},
					},
				},
			},
		}),
		ApiHeader({
			name: 'stripe-signature',
			description: 'Stripe webhook signature for verification',
			required: true,
			example: 't=1640995200,v1=abc123def456...',
		}),
		ApiResponse({
			status: 200,
			description: 'Webhook processed successfully',
			type: WebhookResponseDto,
		}),
		ApiResponse({
			status: 400,
			description: 'Invalid webhook signature or payload',
			type: ErrorResponseDto,
		}),
		ApiResponse({
			status: 500,
			description: 'Internal server error',
			type: ErrorResponseDto,
		}),
	);
};
