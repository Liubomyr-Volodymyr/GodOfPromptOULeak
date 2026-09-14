import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { IMemberView, MembersService } from './services/members.service';
import { UpdateMemberDto } from './dto/update-member.dto';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { FindAllMembersDto } from './dto/find-all-members.dto';
import { PaginationItems } from '../../common/dto/pagination.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { MemberPromptInteractionsPageDto } from './dto/member-prompt-interaction.dto';
import { MemberProductDto } from './dto/member-product.dto';
import { ResetMemberPasswordDto } from './dto/reset-member-password.dto';
import { RefundDto } from './dto/refund.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { BanMemberDto } from './dto/ban-member.dto';
import { UpdateCustomerProductsDto } from './dto/update-customer-products.dto';
import { AdminRole, Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FindMemberActivityDto } from './dto/find-member-activity.dto';
import { TrackActivity } from '../../../modules/activity/activity.decorator';
import { ActivityTypeEnum } from '../../../modules/activity/enums/activity-type.enum';
import { AdminOrdersService } from '../orders/services/admin-orders.service';
import { OrdersPageDto } from '../orders/dto/order.dto';

@ApiTags('Admin Members')
@ApiBearerAuth('access_token')
@UseGuards(AdminJwtGuard, RolesGuard)
@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Manager)
@Controller()
export class MembersController {
	constructor(
		private readonly membersService: MembersService,
		private readonly adminOrdersService: AdminOrdersService,
	) {}

	@Get()
	@ApiOperation({ summary: 'List members with filters and pagination' })
	findAll(@Query() dto: FindAllMembersDto): Promise<PaginationItems<IMemberView>> {
		return this.membersService.findAll(dto);
	}

	@Get('activities')
	@ApiOperation({ summary: 'List activity logs across all members' })
	getAllActivities(@Query() dto: FindMemberActivityDto) {
		return this.membersService.getAllActivities(dto);
	}

	@Get(':id/activity')
	@ApiOperation({ summary: 'List activity logs of a member' })
	async getMemberActivity(@Param('id') userId: string, @Query() dto: FindMemberActivityDto) {
		return this.membersService.getMemberActivity(userId, dto);
	}

	@Get(':id/bookmarks')
	@ApiOperation({ summary: 'List prompts bookmarked by a member' })
	@ApiOkResponse({ type: MemberPromptInteractionsPageDto })
	getMemberBookmarks(
		@Param('id', ParseUUIDPipe) userId: string,
		@Query() dto: PaginationQueryDto,
	): Promise<MemberPromptInteractionsPageDto> {
		return this.membersService.getMemberBookmarks(userId, dto);
	}

	@Get(':id/likes')
	@ApiOperation({ summary: 'List prompts liked by a member' })
	@ApiOkResponse({ type: MemberPromptInteractionsPageDto })
	getMemberLikes(@Param('id', ParseUUIDPipe) userId: string, @Query() dto: PaginationQueryDto): Promise<MemberPromptInteractionsPageDto> {
		return this.membersService.getMemberLikes(userId, dto);
	}

	@Get(':id/products')
	@ApiOperation({ summary: 'List products owned by a member' })
	@ApiOkResponse({ type: [MemberProductDto] })
	getMemberProducts(@Param('id', ParseUUIDPipe) userId: string): Promise<MemberProductDto[]> {
		return this.membersService.getMemberProducts(userId);
	}

	@Get(':id/orders')
	@ApiOperation({ summary: 'List paid orders of a member' })
	@ApiOkResponse({ type: OrdersPageDto })
	getMemberOrders(@Param('id', ParseUUIDPipe) userId: string, @Query() dto: PaginationQueryDto): Promise<OrdersPageDto> {
		return this.adminOrdersService.findByMember(userId, dto);
	}

	@Post('create')
	@ApiOperation({ summary: 'Create a member' })
	createMember(@Body() dto: CreateMemberDto) {
		return this.membersService.createMember(dto);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update member profile fields and status' })
	updateMember(@Param('id', ParseUUIDPipe) userId: string, @Body() dto: UpdateMemberDto): Promise<IMemberView> {
		return this.membersService.updateMember(userId, dto);
	}

	@Post('ban')
	@ApiOperation({ summary: 'Ban a member' })
	banMember(@Body() dto: BanMemberDto) {
		return this.membersService.banMember(dto);
	}

	@Post('reset-password')
	@ApiOperation({ summary: 'Reset member password' })
	updatePassword(@Body() dto: ResetMemberPasswordDto) {
		return this.membersService.resetMemberPassword(dto);
	}

	@Post('update-products')
	@ApiOperation({ summary: 'Grant products to a member' })
	@TrackActivity(ActivityTypeEnum.PRODUCT_GRANTED)
	updateProducts(@Body() dto: UpdateCustomerProductsDto, @Res({ passthrough: true }) res: Response) {
		res.locals.userId = dto.user_id;
		return this.membersService.updateProducts(dto);
	}

	@Post('refund')
	@ApiOperation({ summary: 'Refund a member purchase via Stripe' })
	refund(@Body() dto: RefundDto) {
		return this.membersService.refund(dto);
	}

	@Delete('/:id')
	@ApiOperation({ summary: 'Hard delete a member' })
	hardDelete(@Param('id') userId: string) {
		return this.membersService.hardDelete(userId);
	}
}
