import { IsOptional, IsArray, IsString, IsEnum } from 'class-validator';

export enum StatsGranularity {
	DAY = 'day',
	WEEK = 'week',
	MONTH = 'month',
}

export class ProductStatsChartDto {
	@IsOptional()
	@IsString()
	dateFrom?: string;

	@IsOptional()
	@IsString()
	dateTo?: string;

	@IsOptional()
	@IsEnum(StatsGranularity)
	granularity?: StatsGranularity = StatsGranularity.WEEK;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	productIds?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	types?: string[];
}
