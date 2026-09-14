import { ApiProperty } from '@nestjs/swagger';

export class RefundResponseDto {
	@ApiProperty({
		description: 'Success status',
		example: true,
	})
	success: boolean;

	@ApiProperty({
		description: 'Refund ID from Stripe',
		example: 're_1234567890',
	})
	refund_id: string;

	@ApiProperty({
		description: 'Payment Intent ID that was refunded',
		example: 'pi_1234567890',
	})
	payment_intent_id: string;

	@ApiProperty({
		description: 'Amount refunded in cents',
		example: 2999,
	})
	amount: number;

	@ApiProperty({
		description: 'Currency',
		example: 'usd',
	})
	currency: string;

	@ApiProperty({
		description: 'Refund status',
		example: 'succeeded',
	})
	status: string;

	@ApiProperty({
		description: 'Full refund object from Stripe',
		type: 'object',
	})
	refund: any;
}
