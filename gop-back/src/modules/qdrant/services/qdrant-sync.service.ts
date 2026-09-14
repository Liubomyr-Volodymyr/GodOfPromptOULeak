import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { QdrantService } from './qdrant.service';
import { Prompts } from '../../library/entities/prompts.entity';
import { SyncPromptsDto } from '../dto/qdrant.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class QdrantSyncService {
	constructor(
		@InjectRepository(Prompts)
		private readonly promptsRepo: Repository<Prompts>,
		private readonly qdrantService: QdrantService,
	) {}

	async syncPrompts(dto: SyncPromptsDto) {
		const qb = this.promptsRepo.createQueryBuilder('p');

		qb.select([
			'p.id',
			'p.pageName',
			'p.promptBody',
			'p.description',
			'p.status',
			'p.dateCreated',
			'p.categoryId',
			'p.subCategoryId',
		]).where('p.status = :status', { status: 'published' });

		if (dto.dateUpdatedGte) {
			qb.andWhere('p.date_created >= :date', {
				date: dto.dateUpdatedGte,
			});
		}

		qb.limit(dto.limit ?? 100);
		qb.offset(((dto.page ?? 1) - 1) * (dto.limit ?? 100));

		const prompts = await qb.getMany();

		await this.ingest(prompts);

		return prompts;
	}

	private async ingest(prompts: Prompts[]) {
		await Promise.allSettled(
			prompts.map((prompt: Prompts) =>
				this.qdrantService.addData({
					id: prompt.id,
					category: prompt.categoryId,
					sub_category: prompt.subCategoryId,
					fields: {
						page_name: prompt.pageName,
						prompt_body: prompt.promptBody,
						description: prompt.description,
					},
				}),
			),
		);
	}
}
