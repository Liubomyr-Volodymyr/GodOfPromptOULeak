import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CreateCheckoutSessionWithTrackingDto, CheckoutSessionResponseDto, ErrorResponseDto } from '../dto/stripe.dto';
import { CancelSubscriptionDto } from '../dto/subscription-cancel.dto';
import { SubscriptionCancelResponseDto } from '../dto/subscription-cancel.response.dto';
import { UpdateSubscriptionDto } from '../dto/subscription-update.dto';
import { SubscriptionUpdateResponseDto } from '../dto/subscription-update.response.dto';
import { CreateRefundDto } from '../dto/create-refund.dto';
import { RefundResponseDto } from '../dto/refund.response.dto';

// Checkout Session With Tracking
export const ApiCreateCheckoutSession = () => {
	return applyDecorators(
		ApiBearerAuth('access_token'),
		ApiOperation({
			summary: 'Create Stripe checkout session with tracking',
			description: 'Create a new Stripe checkout session with referral and campaign tracking capabilities',
		}),
		ApiBody({ type: CreateCheckoutSessionWithTrackingDto }),
		ApiResponse({
			status: 201,
			description: 'Checkout session with tracking created successfully',
			type: CheckoutSessionResponseDto,
		}),
		ApiResponse({
			status: 400,
			description: 'Invalid request parameters',
			type: ErrorResponseDto,
		}),
		ApiResponse({
			status: 500,
			description: 'Internal server error',
			type: ErrorResponseDto,
		}),
	);
};

// Subscription Checkout With Tracking
export const ApiCreateSubscriptionCheckout = () => {
	return applyDecorators(
		ApiBearerAuth('access_token'),
		ApiOperation({
			summary: 'Create Stripe subscription checkout session with tracking',
			description: 'Create a new Stripe checkout session for subscription with referral and campaign tracking capabilities',
		}),
		ApiBody({ type: CreateCheckoutSessionWithTrackingDto }),
		ApiResponse({
			status: 201,
			description: 'Subscription checkout session with tracking created successfully',
			type: CheckoutSessionResponseDto,
		}),
		ApiResponse({
			status: 400,
			description: 'Invalid request parameters',
			type: ErrorResponseDto,
		}),
		ApiResponse({
			status: 500,
			description: 'Internal server error',
			type: ErrorResponseDto,
		}),
	);
};

// Get Session Data
export const ApiGetSessionData = () => {
	return applyDecorators(
		ApiOperation({
			summary: 'Get Stripe session data',
			description: 'Retrieve session data by session ID for tracking purposes',
		}),
		ApiParam({
			name: 'sessionId',
			description: 'Stripe session ID',
			type: 'string',
		}),
		ApiResponse({
			status: 200,
			description: 'Session data retrieved successfully',
		}),
		ApiResponse({
			status: 404,
			description: 'Session not found',
			type: ErrorResponseDto,
		}),
	);
};

// Cancel Subscription
export const ApiCancelSubscription = () => {
	return applyDecorators(
		ApiOperation({
			summary: 'Cancel Stripe subscription',
			description: 'Cancel a Stripe subscription either immediately or at the end of the current period',
		}),
		ApiBody({ type: CancelSubscriptionDto }),
		ApiResponse({
			status: 200,
			description: 'Subscription canceled successfully',
			type: SubscriptionCancelResponseDto,
		}),
		ApiResponse({
			status: 400,
			description: 'Invalid request parameters',
			type: ErrorResponseDto,
		}),
		ApiResponse({
			status: 500,
			description: 'Internal server error',
			type: ErrorResponseDto,
		}),
	);
};

// Update Subscription
export const ApiUpdateSubscription = () => {
	return applyDecorators(
		ApiOperation({
			summary: 'Update Stripe subscription',
			description: 'Update a Stripe subscription with new price, quantity, or metadata',
		}),
		ApiBody({ type: UpdateSubscriptionDto }),
		ApiResponse({
			status: 200,
			description: 'Subscription updated successfully',
			type: SubscriptionUpdateResponseDto,
		}),
		ApiResponse({
			status: 400,
			description: 'Invalid request parameters',
			type: ErrorResponseDto,
		}),
		ApiResponse({
			status: 500,
			description: 'Internal server error',
			type: ErrorResponseDto,
		}),
	);
};

// Get Subscription Data
export const ApiGetSubscriptionData = () => {
	return applyDecorators(
		ApiOperation({
			summary: 'Get Stripe subscription data',
			description: 'Retrieve subscription data by subscription ID for management purposes',
		}),
		ApiParam({
			name: 'subscriptionId',
			description: 'Stripe subscription ID',
			type: 'string',
		}),
		ApiResponse({
			status: 200,
			description: 'Subscription data retrieved successfully',
		}),
		ApiResponse({
			status: 404,
			description: 'Subscription not found',
			type: ErrorResponseDto,
		}),
	);
};

// Get Customer Subscriptions
export const ApiGetCustomerSubscriptions = () => {
	return applyDecorators(
		ApiOperation({
			summary: 'Get customer subscriptions',
			description: 'Retrieve all subscriptions for a specific customer',
		}),
		ApiParam({
			name: 'customerId',
			description: 'Stripe customer ID',
			type: 'string',
		}),
		ApiResponse({
			status: 200,
			description: 'Customer subscriptions retrieved successfully',
		}),
		ApiResponse({
			status: 404,
			description: 'Customer not found',
			type: ErrorResponseDto,
		}),
	);
};

export const ApiCreateRefund = () => {
	return applyDecorators(
		ApiOperation({
			summary: 'Create refund for payment',
			description: 'Create a refund for a payment by memberId and productId. Can be full or partial refund.',
		}),
		ApiBody({ type: CreateRefundDto }),
		ApiResponse({
			status: 200,
			description: 'Refund created successfully',
			type: RefundResponseDto,
		}),
		ApiResponse({
			status: 400,
			description: 'Invalid request parameters or payment not found',
			type: ErrorResponseDto,
		}),
		ApiResponse({
			status: 500,
			description: 'Internal server error',
			type: ErrorResponseDto,
		}),
	);
};
