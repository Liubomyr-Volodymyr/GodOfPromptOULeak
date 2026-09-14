import { Controller, Post, Body, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { StripeService } from '../services/stripe.service';
import { CreateCheckoutSessionWithTrackingDto } from '../dto/stripe.dto';
import {
	ApiCreateCheckoutSession,
	ApiCreateSubscriptionCheckout,
	ApiGetSessionData,
	ApiCancelSubscription,
	ApiUpdateSubscription,
	ApiGetSubscriptionData,
	ApiGetCustomerSubscriptions,
	ApiCreateRefund,
} from '../docs/api-stripe.decorators';
import { CreateRefundDto } from '../dto/create-refund.dto';
import { UpdateSubscriptionDto } from '../dto/subscription-update.dto';
import { CancelSubscriptionDto } from '../dto/subscription-cancel.dto';
import { JwtAuthGuard } from '../../../auth/guards';

@ApiTags('Billing stripe')
@Controller('billing/stripe')
export class StripeController {
	constructor(private readonly stripeService: StripeService) {}

	@Post('purchase-checkout')
	@ApiCreateCheckoutSession()
	async createCheckoutSessionWithTracking(@Body() dto: CreateCheckoutSessionWithTrackingDto) {
		return this.stripeService.createCheckoutSessionWithTracking(dto);
	}

	@Post('subscription-checkout')
	@ApiCreateSubscriptionCheckout()
	@ApiBearerAuth('access_token')
	@UseGuards(JwtAuthGuard)
	async createSubscriptionCheckoutWithTracking(@Body() body: CreateCheckoutSessionWithTrackingDto, @Req() req: Request) {
		return this.stripeService.createSubscriptionCheckoutWithTracking(body, req.user);
	}

	@Get('session/:sessionId')
	@ApiGetSessionData()
	async getSessionData(@Param('sessionId') sessionId: string) {
		return this.stripeService.getSessionData(sessionId);
	}

	@Post('cancel-subscription')
	@ApiCancelSubscription()
	async cancelSubscription(@Body() body: CancelSubscriptionDto) {
		return this.stripeService.cancelSubscription(body);
	}

	@Post('update-subscription')
	@ApiUpdateSubscription()
	async updateSubscription(@Body() body: UpdateSubscriptionDto) {
		return this.stripeService.updateSubscription(body);
	}

	@Get('subscription/:subscriptionId')
	@ApiGetSubscriptionData()
	async getSubscriptionData(@Param('subscriptionId') subscriptionId: string) {
		return this.stripeService.getSubscriptionData(subscriptionId);
	}

	@Get('customer/:customerId/subscriptions')
	@ApiGetCustomerSubscriptions()
	async getCustomerSubscriptions(@Param('customerId') customerId: string) {
		return this.stripeService.getCustomerSubscriptions(customerId);
	}

	@Post('refund')
	@ApiCreateRefund()
	async createRefund(@Body() body: CreateRefundDto) {
		return this.stripeService.createRefund(body);
	}

	@Post('test-subscription-webhook/:subscriptionId')
	@ApiOperation({
		summary: 'Test subscription webhook locally',
		description:
			'Simulate subscription.update webhook event using real subscription data from Stripe API. Useful for local testing without Stripe webhook URL.',
	})
	@ApiParam({
		name: 'subscriptionId',
		description: 'Stripe subscription ID',
		example: 'sub_1SdQU3ABwKn0uHUMVkEpjEaX',
	})
	@ApiResponse({
		status: 200,
		description: 'Webhook event simulated successfully',
	})
	async testSubscriptionWebhook(@Param('subscriptionId') subscriptionId: string) {
		return this.stripeService.testSubscriptionWebhook(subscriptionId);
	}
}
