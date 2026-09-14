import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ReviewsService } from '../services/reviews.service';
import { ReviewsQueryDto } from '../dto/reviews-query.dto';
import { ReviewsPageDto } from '../dto/reviews-page.dto';
import { Review } from '../entities/review.entity';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
	constructor(private readonly reviewsService: ReviewsService) {}

	@Get()
	@ApiOperation({ summary: 'List reviews' })
	@ApiOkResponse({ type: ReviewsPageDto })
	list(@Query() dto: ReviewsQueryDto): Promise<ReviewsPageDto> {
		return this.reviewsService.findAll(dto);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get single review' })
	@ApiOkResponse({ type: Review })
	get(@Param('id', ParseUUIDPipe) id: string): Promise<Review> {
		return this.reviewsService.findOne(id);
	}
}
