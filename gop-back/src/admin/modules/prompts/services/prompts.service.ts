import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IModeratorStats } from '../interfaces/prompts.interfaces';
import { ModeratorStatsDto } from '../dto/moderator-stats.dto';
import { Prompts } from '../../../../modules/library/entities/prompts.entity';

@Injectable()
export class PromptsService {
	constructor(
		@InjectRepository(Prompts)
		private readonly promptRepo: Repository<Prompts>,
	) {}
	async getModeratorStats(dto: ModeratorStatsDto): Promise<IModeratorStats[]> {
		try {
			const qb = this.promptRepo
				.createQueryBuilder('p')
				.leftJoin('users', 'u', 'u.id = p.moderator_id')
				.select('p.moderator_id', 'moderator_id')
				.addSelect('u.first_name', 'first_name')
				.addSelect('u.last_name', 'last_name')
				.addSelect('COUNT(*)', 'total_prompts')
				.addSelect(`COUNT(*) FILTER (WHERE p.status = 'published')`, 'published_prompts')
				.addSelect('COALESCE(SUM(p.likes_count),0)', 'total_likes')
				.addSelect('COALESCE(SUM(p.views_count),0)', 'total_views')
				.addSelect('COALESCE(SUM(p.generation_cost),0)', 'total_costs')
				.addSelect('MAX(p.date_created)', 'last_created_at')
				.addSelect('MAX(p.date_published)', 'last_published_at')
				.where('p.moderator_id IS NOT NULL');

			if (dto.dateFrom) {
				qb.andWhere('p.date_created >= :dateFrom', { dateFrom: dto.dateFrom });
			}

			if (dto.dateTo) {
				qb.andWhere('p.date_created <= :dateTo', {
					dateTo: `${dto.dateTo}T23:59:59`,
				});
			}

			qb.groupBy('p.moderator_id').addGroupBy('u.first_name').addGroupBy('u.last_name');

			const rows = await qb.getRawMany();

			return rows.map((r) => ({
				moderator_id: r.moderator_id,
				first_name: r.first_name ?? '',
				last_name: r.last_name ?? '',
				total_prompts: Number(r.total_prompts),
				published_prompts: Number(r.published_prompts),
				total_likes: Number(r.total_likes),
				total_views: Number(r.total_views),
				total_costs: Number(r.total_costs),
				last_created_at: r.last_created_at,
				last_published_at: r.last_published_at,
			}));
		} catch (e) {
			throw new HttpException('Failed to fetch moderator stats', HttpStatus.BAD_GATEWAY);
		}
	}
}
