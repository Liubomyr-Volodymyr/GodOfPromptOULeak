import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProductStatsChartDto, ProductStatsChartResponseDto } from '../dto';

import { UserProducts } from '../../../../modules/user-products/entities/user-products.entity';

type Granularity = 'day' | 'week' | 'month';

function normalizeDateRange(dateFrom?: string, dateTo?: string) {
	const now = new Date();

	const to = dateTo ? new Date(dateTo) : now;
	const from = dateFrom ? new Date(dateFrom) : new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

	return { from, to };
}

function getBucketStart(date: Date, granularity: Granularity): Date {
	const d = new Date(date);

	if (granularity === 'day') {
		d.setHours(0, 0, 0, 0);
		return d;
	}

	if (granularity === 'month') {
		return new Date(d.getFullYear(), d.getMonth(), 1);
	}

	const day = d.getDay() || 7;
	if (day !== 1) d.setDate(d.getDate() - (day - 1));

	d.setHours(0, 0, 0, 0);
	return d;
}

function formatDate(date: Date): string {
	return date.toISOString().split('T')[0];
}

function addStep(date: Date, granularity: Granularity): Date {
	const d = new Date(date);

	if (granularity === 'day') {
		d.setDate(d.getDate() + 1);
		return d;
	}

	if (granularity === 'month') {
		d.setMonth(d.getMonth() + 1);
		return d;
	}

	d.setDate(d.getDate() + 7);
	return d;
}

@Injectable()
export class StatsService {
	constructor(
		@InjectRepository(UserProducts)
		private readonly userProductRepo: Repository<UserProducts>,
	) {}

	async productStatsByDate(dto: ProductStatsChartDto): Promise<ProductStatsChartResponseDto> {
		try {
			const granularity = dto.granularity ?? 'week';
			const { from, to } = normalizeDateRange(dto.dateFrom, dto.dateTo);

			const rows = await this.userProductRepo
				.createQueryBuilder('up')
				.leftJoin('up.price', 'price')
				.select(['up.id as id', 'up.grantedAt as grantedAt', 'price.id as priceId', 'price.productPriceName as productName'])
				.where('up.status = :status', { status: 'active' })
				.andWhere('up.grantedAt BETWEEN :from AND :to', {
					from,
					to,
				})
				.getRawMany<{
					id: string;
					grantedAt: Date;
					priceId: string;
					productName: string;
				}>();

			if (!rows.length) {
				return {
					granularity,
					series: [],
					data: [],
				};
			}

			const bucketMap = new Map<string, Map<string, number>>();
			const productSet = new Map<string, string>();

			for (const row of rows) {
				if (!row.grantedAt) continue;

				const bucketDate = getBucketStart(new Date(row.grantedAt), granularity);
				const bucketKey = formatDate(bucketDate);

				if (!bucketMap.has(bucketKey)) {
					bucketMap.set(bucketKey, new Map());
				}

				const productId = row.priceId;
				const productName = row.productName || 'unknown';

				productSet.set(productId, productName);

				const products = bucketMap.get(bucketKey)!;

				products.set(productId, (products.get(productId) || 0) + 1);
			}

			const start = getBucketStart(from, granularity);
			const end = getBucketStart(to, granularity);

			const timeline: string[] = [];

			let cursor = new Date(start);

			while (cursor <= end) {
				timeline.push(formatDate(cursor));
				cursor = addStep(cursor, granularity);
			}

			const series = Array.from(productSet.entries()).map(([productId, productName]) => ({
				productId,
				productName,
			}));

			const data = timeline.map((bucket) => {
				const productsMap = bucketMap.get(bucket) || new Map();

				const products = Array.from(productSet.entries()).map(([productId, productName]) => ({
					productId,
					productName,
					count: productsMap.get(productId) || 0,
				}));

				return {
					bucket,
					products,
					total: products.reduce((sum, p) => sum + p.count, 0),
				};
			});

			return {
				granularity,
				series,
				data,
			};
		} catch (e: any) {
			throw new InternalServerErrorException(e?.message || 'Failed to fetch product stats');
		}
	}
}
