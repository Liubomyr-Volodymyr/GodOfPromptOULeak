import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ReviewsService } from '../services/reviews.service';
import { ReviewsQueryDto } from '../dto/reviews-query.dto';
import { ReviewsPageDto } from '../dto/reviews-page.dto';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { Review } from '../entities/review.entity';
import { AdminJwtGuard } from '../../../admin/modules/auth/guards/admin-jwt.guard';
import { RolesGuard } from '../../../admin/modules/auth/guards/roles.guard';
import { AdminRole, Roles } from '../../../admin/common/decorators/roles.decorator';

@ApiTags('Reviews Admin')
@ApiBearerAuth('access_token')
@Controller('reviews/admin')
@Roles(AdminRole.Manager, AdminRole.Admin, AdminRole.SuperAdmin)
@UseGuards(AdminJwtGuard, RolesGuard)
export class AdminReviewsController {
	constructor(private readonly reviewsService: ReviewsService) {}

	@Get()
	@ApiOperation({ summary: 'List reviews (admin)' })
	@ApiOkResponse({ type: ReviewsPageDto })
	list(@Query() dto: ReviewsQueryDto): Promise<ReviewsPageDto> {
		return this.reviewsService.findAll(dto);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get single review (admin)' })
	@ApiOkResponse({ type: Review })
	get(@Param('id', ParseUUIDPipe) id: string): Promise<Review> {
		return this.reviewsService.findOne(id);
	}

	@Post()
	@ApiOperation({ summary: 'Create review (admin)' })
	@ApiOkResponse({ type: Review })
	create(@Body() dto: CreateReviewDto): Promise<Review> {
		return this.reviewsService.create(dto);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update review (admin)' })
	@ApiOkResponse({ type: Review })
	update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateReviewDto): Promise<Review> {
		return this.reviewsService.update(id, dto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete review (admin)' })
	delete(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
		return this.reviewsService.remove(id);
	}
}
