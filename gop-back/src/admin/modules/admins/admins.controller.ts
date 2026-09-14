import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminsService } from './services/admins.service';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { PaginationItems } from '../../common/dto/pagination.dto';
import { FindAllAdminsDto } from './dto/find-all-admins.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminRole, Roles } from '../../common/decorators/roles.decorator';
import { Admins } from '../../entities/admins.entity';

@ApiTags('Admins')
@ApiBearerAuth('access_token')
@Controller()
export class AdminsController {
	constructor(private readonly adminsService: AdminsService) {}

	@Get()
	@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Manager)
	@UseGuards(AdminJwtGuard, RolesGuard)
	async findAll(@Query() dto: FindAllAdminsDto): Promise<PaginationItems<Admins>> {
		return this.adminsService.findAll(dto);
	}

	@Post()
	@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Manager)
	@UseGuards(AdminJwtGuard, RolesGuard)
	async createAdmin(@Body() dto: CreateAdminDto) {
		return this.adminsService.createAdmin(dto);
	}

	@Delete('/:id')
	@Roles(AdminRole.SuperAdmin)
	@UseGuards(AdminJwtGuard, RolesGuard)
	async deleteAdmin(@Param('id') id: number, @Req() req: Request) {
		if (id === req.user.userId) throw new ForbiddenException('You cannot delete yourself');
		return this.adminsService.deleteAdmin(id);
	}
}
