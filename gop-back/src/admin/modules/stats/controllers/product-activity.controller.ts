import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatsService } from '../services/stats.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../../auth/guards/admin-jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AdminRole, Roles } from '../../../common/decorators/roles.decorator';
import { ProductStatsChartDto } from '../dto';

@Controller()
@ApiTags('Admin Stats')
@ApiBearerAuth('access_token')
@UseGuards(AdminJwtGuard, RolesGuard)
@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Manager)
export class ProductActivityController {
	constructor(private readonly statsService: StatsService) {}

	@Get('products')
	async getProductsStats(@Query() dto: ProductStatsChartDto) {
		return this.statsService.productStatsByDate(dto);
	}
}
