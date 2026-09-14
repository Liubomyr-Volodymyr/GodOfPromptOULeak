import { IsOptional, IsString } from 'class-validator';

export class ModeratorStatsDto {
	@IsOptional()
	@IsString()
	dateFrom?: string;

	@IsOptional()
	@IsString()
	dateTo?: string;
}
