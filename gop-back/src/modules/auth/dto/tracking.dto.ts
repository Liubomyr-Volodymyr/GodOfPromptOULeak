import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TrackingInfoDto {
	@IsOptional()
	@IsString()
	utm_source?: string;

	@IsOptional()
	@IsString()
	utm_medium?: string;

	@IsOptional()
	@IsString()
	utm_campaign?: string;

	@IsOptional()
	@IsString()
	utm_content?: string;

	@IsOptional()
	@IsString()
	utm_term?: string;

	@IsOptional()
	@IsString()
	affiliate_id?: string;

	@IsOptional()
	@IsString()
	click_id?: string;

	@IsOptional()
	@IsString()
	product_slug?: string;
}

export class TrackingDto {
	@ValidateNested()
	@Type(() => TrackingInfoDto)
	tracking?: TrackingInfoDto;
}
