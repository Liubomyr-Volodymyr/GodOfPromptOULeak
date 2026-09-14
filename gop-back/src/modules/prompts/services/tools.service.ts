import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, WhereExpressionBuilder } from 'typeorm';
import { Tool } from '../../library/entities/tools.entity';
import { CreateToolDto } from '../dto/create-tool.dto';
import { UpdateToolDto } from '../dto/update-tool.dto';

@Injectable()
export class ToolsService {
	constructor(
		@InjectRepository(Tool)
		private readonly toolsRepo: Repository<Tool>,
	) {}

	async create(dto: CreateToolDto): Promise<Tool> {
		const dupQb = this.toolsRepo.createQueryBuilder('t').where('t.slug = :slug', { slug: dto.slug });
		if (dto.public_id != null) {
			dupQb.orWhere('t.public_id = :publicId', { publicId: dto.public_id });
		}
		const dup: Tool | null = await dupQb.getOne();
		if (dup) {
			throw new HttpException('Tool with same slug or public_id already exists', HttpStatus.CONFLICT);
		}

		try {
			return await this.toolsRepo.save(this.toolsRepo.create(this.mapToolFields(dto)));
		} catch {
			throw new HttpException('Failed to create tool', HttpStatus.BAD_GATEWAY);
		}
	}

	async update(id: number, dto: UpdateToolDto): Promise<Tool> {
		const tool: Tool | null = await this.toolsRepo.findOne({ where: { id } });
		if (!tool) {
			throw new HttpException('Tool not found', HttpStatus.NOT_FOUND);
		}

		if (dto.slug != null || dto.public_id != null) {
			const dup: Tool | null = await this.toolsRepo
				.createQueryBuilder('t')
				.where('t.id != :id', { id })
				.andWhere(
					new Brackets((qb: WhereExpressionBuilder): void => {
						if (dto.slug != null) qb.orWhere('t.slug = :slug', { slug: dto.slug });
						if (dto.public_id != null) qb.orWhere('t.public_id = :publicId', { publicId: dto.public_id });
					}),
				)
				.getOne();
			if (dup) {
				throw new HttpException('Tool with same slug or public_id already exists', HttpStatus.CONFLICT);
			}
		}

		try {
			this.toolsRepo.merge(tool, this.mapToolFields(dto));
			return await this.toolsRepo.save(tool);
		} catch {
			throw new HttpException('Failed to update tool', HttpStatus.BAD_GATEWAY);
		}
	}

	async delete(id: number): Promise<{ success: boolean }> {
		const tool: Tool | null = await this.toolsRepo.findOne({ where: { id } });
		if (!tool) {
			throw new HttpException('Tool not found', HttpStatus.NOT_FOUND);
		}

		try {
			await this.toolsRepo.remove(tool);
			return { success: true };
		} catch {
			throw new HttpException('Failed to delete tool', HttpStatus.BAD_GATEWAY);
		}
	}

	async findBySlugs(slugs: string[]): Promise<Tool[]> {
		try {
			const found: Tool[] = await this.toolsRepo.findBy({ slug: In(slugs) });
			const bySlug: Map<string, Tool> = new Map<string, Tool>(found.map((t: Tool): [string, Tool] => [t.slug, t]));

			const missing: string[] = slugs.filter((name: string): boolean => !bySlug.has(name));
			if (missing.length > 0) {
				throw new HttpException(`Tool with slug="${missing[0]}" not found`, HttpStatus.NOT_FOUND);
			}

			return slugs.map((name: string): Tool => bySlug.get(name) as Tool);
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new HttpException('Failed to get tools by slug', HttpStatus.BAD_GATEWAY);
		}
	}

	async findByIds(ids: number[]): Promise<Tool[]> {
		try {
			if (!ids?.length) return [];

			return await this.toolsRepo.createQueryBuilder('t').where('t.id IN (:...ids)', { ids }).getMany();
		} catch {
			throw new HttpException('Failed to fetch tools', HttpStatus.BAD_GATEWAY);
		}
	}

	async findRecommended(limit?: number, offset?: number): Promise<{ data: Tool[] }> {
		try {
			const qb = this.toolsRepo.createQueryBuilder('tool');

			if (limit !== -1) {
				qb.take(limit || 50);
				qb.skip(offset || 0);
			}

			qb.orderBy('tool.id', 'ASC');

			const data: Tool[] = await qb.getMany();

			return { data };
		} catch (e) {
			throw new HttpException((e as Error).message || 'Failed to fetch tools', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	private mapToolFields(dto: CreateToolDto | UpdateToolDto): Partial<Tool> {
		const fields: Partial<Tool> = {};
		if (dto.name !== undefined) fields.name = dto.name;
		if (dto.slug !== undefined) fields.slug = dto.slug;
		if (dto.public_id !== undefined) fields.public_id = dto.public_id ?? null;
		if (dto.description !== undefined) fields.description = dto.description ?? null;
		if (dto.url !== undefined) fields.url = dto.url ?? null;
		if (dto.type !== undefined) fields.type = dto.type ?? null;
		if (dto.parent_id !== undefined) fields.parent_id = dto.parent_id ?? null;
		if (dto.title !== undefined) fields.title = dto.title ?? null;
		if (dto.h1 !== undefined) fields.h1 = dto.h1 ?? null;
		if (dto.seo_description !== undefined) fields.seo_description = dto.seo_description ?? null;
		if (dto.behavior !== undefined) fields.behavior = dto.behavior ?? null;
		if (dto.tips !== undefined) fields.tips = dto.tips ?? null;
		if (dto.how_to_use !== undefined) fields.how_to_use = dto.how_to_use ?? null;
		if (dto.best_for !== undefined) fields.best_for = dto.best_for ?? null;
		if (dto.icon !== undefined) fields.icon = dto.icon ?? null;
		if (dto.hero_image_url !== undefined) fields.hero_image_url = dto.hero_image_url ?? null;
		if (dto.screenshot_image_url !== undefined) fields.screenshot_image_url = dto.screenshot_image_url ?? null;
		if (dto.pricing_model !== undefined) fields.pricing_model = dto.pricing_model ?? null;
		if (dto.pricing_summary !== undefined) fields.pricing_summary = dto.pricing_summary ?? null;
		if (dto.plb_instructions !== undefined) fields.plb_instructions = dto.plb_instructions ?? null;
		if (dto.supports_variables !== undefined) fields.supports_variables = dto.supports_variables;
		if (dto.published_at !== undefined) fields.published_at = dto.published_at ? new Date(dto.published_at) : null;
		if (dto.last_reviewed_at !== undefined) {
			fields.last_reviewed_at = dto.last_reviewed_at ? new Date(dto.last_reviewed_at) : null;
		}
		return fields;
	}
}
