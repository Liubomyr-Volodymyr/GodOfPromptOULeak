import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelSubscriptionDto {
	@ApiProperty({
		description: 'Subscription ID to cancel',
		example: 'sub_1234567890',
	})
	@IsString()
	subscription_id: string;

	@ApiPropertyOptional({
		description: 'Cancel immediately or at period end',
		example: false,
		default: false,
	})
	@IsOptional()
	immediate?: boolean;

	@ApiPropertyOptional({
		description: 'Cancellation reason',
		example: 'Customer requested cancellation',
	})
	@IsOptional()
	@IsString()
	cancellation_reason?: string;
}
