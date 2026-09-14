import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionCancelResponseDto {
	@ApiProperty({
		description: 'Success status',
		example: true,
	})
	success: boolean;

	@ApiProperty({
		description: 'Subscription ID',
		example: 'sub_1234567890',
	})
	subscription_id: string;

	@ApiProperty({
		description: 'Subscription status after cancellation',
		example: 'canceled',
	})
	status: string;

	@ApiProperty({
		description: 'Cancellation timestamp',
		example: 1640995200,
	})
	canceled_at?: number;

	@ApiProperty({
		description: 'Cancel at period end flag',
		example: true,
	})
	cancel_at_period_end?: boolean;

	@ApiProperty({
		description: 'Full subscription object from Stripe',
		type: 'object',
	})
	subscription: any;
}
