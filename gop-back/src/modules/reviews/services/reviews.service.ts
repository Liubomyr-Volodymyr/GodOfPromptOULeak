import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { Review } from '../entities/review.entity';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { ReviewSortField, ReviewsQueryDto, SortOrder } from '../dto/reviews-query.dto';
import { ReviewsPageDto } from '../dto/reviews-page.dto';
import { toHttpError } from '../../../common/helpers/http-error.helper';

@Injectable()
export class ReviewsService {
	constructor(
		@InjectRepository(Review)
		private readonly reviewsRepo: Repository<Review>,
	) {}

	async findAll(dto: ReviewsQueryDto): Promise<ReviewsPageDto> {
		try {
			const queryBuilder: SelectQueryBuilder<Review> = this.reviewsRepo.createQueryBuilder('review');

			if (dto.min_stars !== undefined) {
				queryBuilder.andWhere('review.stars_amount >= :minStars', { minStars: dto.min_stars });
			}

			const sortMap: Record<ReviewSortField, string> = {
				[ReviewSortField.CREATED_AT]: 'review.createdAt',
				[ReviewSortField.UPDATED_AT]: 'review.updatedAt',
				[ReviewSortField.STARS_AMOUNT]: 'review.stars_amount',
			};
			const sortField: string = sortMap[dto.sort] ?? 'review.createdAt';
			const order: 'ASC' | 'DESC' = dto.order === SortOrder.ASC ? 'ASC' : 'DESC';

			queryBuilder.orderBy(sortField, order);
			queryBuilder.skip(dto.offset ?? 0).take(dto.limit ?? 24);

			const [items, total]: [Review[], number] = await queryBuilder.getManyAndCount();

			return {
				data: items,
				meta: {
					total,
					limit: dto.limit,
					offset: dto.offset,
				},
			};
		} catch (error) {
			throw toHttpError(error, 'Failed to fetch reviews');
		}
	}

	async findOne(id: string): Promise<Review> {
		const review: Review | null = await this.reviewsRepo.findOne({ where: { id } });
		if (!review) throw new NotFoundException('Review not found');
		return review;
	}

	async create(dto: CreateReviewDto): Promise<Review> {
		try {
			const review: Review = this.reviewsRepo.create({
				review: dto.review,
				user: dto.user,
				stars_amount: dto.stars_amount,
			});
			return await this.reviewsRepo.save(review);
		} catch (error) {
			throw toHttpError(error, 'Failed to create review');
		}
	}

	async update(id: string, dto: UpdateReviewDto): Promise<Review> {
		const review: Review = await this.findOne(id);

		try {
			if (dto.review !== undefined) review.review = dto.review;
			if (dto.user !== undefined) review.user = dto.user;
			if (dto.stars_amount !== undefined) review.stars_amount = dto.stars_amount;
			review.updatedAt = new Date();

			return await this.reviewsRepo.save(review);
		} catch (error) {
			throw toHttpError(error, 'Failed to update review');
		}
	}

	async remove(id: string): Promise<{ success: boolean }> {
		const review: Review = await this.findOne(id);

		try {
			await this.reviewsRepo.remove(review);
			return { success: true };
		} catch (error) {
			throw toHttpError(error, 'Failed to delete review');
		}
	}
}
