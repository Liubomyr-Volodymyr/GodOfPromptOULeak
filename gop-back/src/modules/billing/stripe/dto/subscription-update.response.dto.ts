import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionUpdateResponseDto {
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
		description: 'Subscription status after update',
		example: 'active',
	})
	status: string;

	@ApiProperty({
		description: 'Current period start',
		example: 1640995200,
	})
	current_period_start: number;

	@ApiProperty({
		description: 'Current period end',
		example: 1643673600,
	})
	current_period_end: number;

	@ApiProperty({
		description: 'Full subscription object from Stripe',
		type: 'object',
	})
	subscription: any;
}
