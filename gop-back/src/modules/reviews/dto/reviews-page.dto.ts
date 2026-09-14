import { Review } from '../entities/review.entity';

export class ReviewsListMetaDto {
	total: number;
	limit?: number;
	offset?: number;
}

export class ReviewsPageDto {
	data: Review[];
	meta: ReviewsListMetaDto;
}
