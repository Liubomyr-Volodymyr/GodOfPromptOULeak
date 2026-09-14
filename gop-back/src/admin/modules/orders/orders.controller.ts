import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOrdersService } from './services/admin-orders.service';
import { FindAllOrdersDto } from './dto/find-all-orders.dto';
import { OrderDto, OrdersPageDto, OrdersTotalsDto } from './dto/order.dto';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminRole, Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin Orders')
@ApiBearerAuth('access_token')
@UseGuards(AdminJwtGuard, RolesGuard)
@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Manager)
@Controller()
export class AdminOrdersController {
	constructor(private readonly adminOrdersService: AdminOrdersService) {}

	@Get()
	@ApiOperation({ summary: 'List paid orders with filters and pagination' })
	@ApiOkResponse({ type: OrdersPageDto })
	findAll(@Query() dto: FindAllOrdersDto): Promise<OrdersPageDto> {
		return this.adminOrdersService.findAll(dto);
	}

	@Get('totals')
	@ApiOperation({ summary: 'Sum orders matching the same filters as the list' })
	@ApiOkResponse({ type: OrdersTotalsDto })
	getTotals(@Query() dto: FindAllOrdersDto): Promise<OrdersTotalsDto> {
		return this.adminOrdersService.getTotals(dto);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a single order' })
	@ApiOkResponse({ type: OrderDto })
	findOne(@Param('id', ParseUUIDPipe) orderId: string): Promise<OrderDto> {
		return this.adminOrdersService.findOne(orderId);
	}
}
