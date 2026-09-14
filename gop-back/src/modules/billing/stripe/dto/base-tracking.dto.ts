import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BaseTrackingDto {
	@ApiPropertyOptional({
		description: 'Referral code for tracking',
		example: 'REF123',
	})
	@IsOptional()
	@IsString()
	referral_code?: string;

	@ApiPropertyOptional({
		description: 'Partner ID for tracking',
		example: 'PARTNER456',
	})
	@IsOptional()
	@IsString()
	partner_id?: string;

	@ApiPropertyOptional({
		description: 'Campaign ID for tracking',
		example: 'CAMP789',
	})
	@IsOptional()
	@IsString()
	campaign_id?: string;

	@ApiPropertyOptional({
		description: 'Source identifier',
		example: 'website',
	})
	@IsOptional()
	@IsString()
	source?: string;

	@ApiPropertyOptional({
		description: 'UTM Source',
		example: 'google',
	})
	@IsOptional()
	@IsString()
	utm_source?: string;

	@ApiPropertyOptional({
		description: 'UTM Medium',
		example: 'cpc',
	})
	@IsOptional()
	@IsString()
	utm_medium?: string;

	@ApiPropertyOptional({
		description: 'UTM Campaign',
		example: 'summer_sale',
	})
	@IsOptional()
	@IsString()
	utm_campaign?: string;

	@ApiPropertyOptional({
		description: 'UTM Term',
		example: 'running_shoes',
	})
	@IsOptional()
	@IsString()
	utm_term?: string;

	@ApiPropertyOptional({
		description: 'UTM Content',
		example: 'banner_ad',
	})
	@IsOptional()
	@IsString()
	utm_content?: string;

	@ApiPropertyOptional({
		description: 'Click ID for tracking',
		example: 'CLICK123456',
	})
	@IsOptional()
	@IsString()
	click_id?: string;

	@ApiPropertyOptional({
		description: 'Affiliate ID for tracking',
		example: 'AFF789',
	})
	@IsOptional()
	@IsString()
	affiliate_id?: string;

	@ApiPropertyOptional({
		description: 'Tolt referral ID for affiliate tracking (from tolt.js cookie)',
		example: 'tolt_ref_abc123',
	})
	@IsOptional()
	@IsString()
	tolt_referral?: string;
}
