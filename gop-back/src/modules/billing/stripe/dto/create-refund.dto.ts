import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRefundDto {
	@ApiProperty({
		description: 'Member ID (UUID)',
		example: '4474899c-f577-4f44-aea0-9d3ac30d9aeb',
	})
	@IsString()
	memberId: string;

	@ApiProperty({
		description: 'Product ID (UUID or Stripe product ID)',
		example: '10fb5a40-2767-4efe-9467-a7cc35d4c335',
	})
	@IsString()
	productId: string;

	@ApiPropertyOptional({
		description: 'Amount to refund in cents. If not provided, full refund will be issued',
		example: 2999,
	})
	@IsOptional()
	@IsNumber()
	amount?: number;

	@ApiPropertyOptional({
		description: 'Reason for refund',
		example: 'Customer request',
	})
	@IsOptional()
	@IsString()
	reason?: string;
}
