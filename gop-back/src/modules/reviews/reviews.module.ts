import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Review } from './entities/review.entity';
import { ReviewsService } from './services/reviews.service';
import { ReviewsController } from './controllers/reviews.controller';
import { AdminReviewsController } from './controllers/admin-reviews.controller';

@Module({
	imports: [TypeOrmModule.forFeature([Review])],
	controllers: [AdminReviewsController, ReviewsController],
	providers: [ReviewsService],
	exports: [ReviewsService],
})
export class ReviewsModule {}
