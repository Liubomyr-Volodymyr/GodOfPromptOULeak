import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateSubscriptionDto {
	@ApiProperty({
		description: 'Subscription ID to update',
		example: 'sub_1234567890',
	})
	@IsString()
	subscription_id: string;

	@ApiPropertyOptional({
		description: 'New price ID for subscription',
		example: 'price_1234567890',
	})
	@IsOptional()
	@IsString()
	price_id?: string;

	@ApiPropertyOptional({
		description: 'New quantity for subscription',
		example: 2,
	})
	@IsOptional()
	@IsNumber()
	quantity?: number;

	@ApiPropertyOptional({
		description: 'Proration behavior when updating',
		example: 'create_prorations',
	})
	@IsOptional()
	@IsString()
	proration_behavior?: 'create_prorations' | 'none' | 'always_invoice';

	@ApiPropertyOptional({
		description: 'Additional metadata to update',
		type: 'object',
		example: { updated_by: 'admin', reason: 'plan_upgrade' },
	})
	@IsOptional()
	@IsObject()
	metadata?: Record<string, string>;
}
