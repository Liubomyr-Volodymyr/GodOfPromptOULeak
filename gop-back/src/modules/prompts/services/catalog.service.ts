import { ConflictException, HttpException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';

import { InputFormat } from '../../library/entities/input-format.entity';
import { OutputTypes } from '../../user-products/entities/output-types.entity';
import { PromptFormat } from '../../library/entities/prompt-format.entity';
import { PromptFormatTools } from '../../library/entities/prompt-format-tools.entity';
import { Categories } from '../../library/entities/categories.entity';
import { AudienceType } from '../../library/entities/audience-type.entity';

import { CategoriesQueryDto } from '../dto/categories-query.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CreateOutputTypeDto } from '../dto/create-output-type.dto';
import { UpdateNamedTechDto } from '../dto/named-tech.dto';
import { CreateAudienceTypeDto, UpdateAudienceTypeDto } from '../dto/audience-type.dto';
import { CategoryDto } from '../dto/categories.dto';
import { PromptTypeDto } from '../dto/prompt-types.dto';
import { InputTypeDto } from '../dto/input-types.dto';

import { toHttpError } from '../../../common/helpers/http-error.helper';

export interface ICategoryItem {
	id: number;
	name: string;
	parent: number | null;
}

export interface IInputFormatItem {
	id: number;
	name: string;
	tech_name: string;
}

interface ICategoryRawRow {
	id: number;
	name: string;
	parent: number | null;
}

@Injectable()
export class CatalogService {
	constructor(
		@InjectRepository(InputFormat)
		private readonly inputFormatRepo: Repository<InputFormat>,
		@InjectRepository(OutputTypes)
		private readonly outputTypesRepo: Repository<OutputTypes>,
		@InjectRepository(PromptFormat)
		private readonly promptFormatRepo: Repository<PromptFormat>,
		@InjectRepository(Categories)
		private readonly categoryRepo: Repository<Categories>,
		@InjectRepository(AudienceType)
		private readonly audienceTypeRepo: Repository<AudienceType>,
	) {}

	async getInputTypeById(id: number): Promise<InputFormat> {
		try {
			return this.inputFormatRepo.findOne({ where: { id } });
		} catch (error) {
			throw toHttpError(error, 'Failed to get input type');
		}
	}

	async getInputFormatByTechName(techName: string): Promise<InputFormat> {
		try {
			const inputType: InputFormat | null = await this.inputFormatRepo.findOne({ where: { techName } });

			if (!inputType) {
				throw new HttpException(`Input type with tech_name="${techName}" not found`, HttpStatus.NOT_FOUND);
			}

			return inputType;
		} catch (error) {
			throw toHttpError(error, 'Failed to get input type by tech_name');
		}
	}

	async getOutputTypeByTechName(techName: string): Promise<InputTypeDto[]> {
		try {
			const result: OutputTypes | null = await this.outputTypesRepo.findOne({ where: { techName } });
			if (!result) return [];

			return [{ id: result.id, sort: null, name: result.name, tech_name: result.techName }];
		} catch (error) {
			throw toHttpError(error, `Failed to get output type by tech_name=${techName}`);
		}
	}

	async getPromptTypeById(promptTypeId: number): Promise<PromptTypeDto> {
		try {
			const promptType: PromptFormat | null = await this.promptFormatRepo
				.createQueryBuilder('pf')
				.leftJoin('pf.toolRelations', 'rt')
				.leftJoin('rt.tool', 'tool')
				.select(['pf.id', 'pf.name', 'pf.techName', 'rt.id', 'tool.id', 'tool.slug'])
				.where('pf.id = :id', { id: promptTypeId })
				.getOne();

			if (!promptType) {
				throw new HttpException(`Prompt type with id="${promptTypeId}" not found`, HttpStatus.NOT_FOUND);
			}

			return {
				id: promptType.id,
				name: promptType.name,
				tech_name: promptType.techName,
				tools: (promptType.toolRelations || []).map((rt: PromptFormatTools) => ({
					models_id: rt.tool?.id,
					slug: rt.tool?.slug,
				})),
			};
		} catch (error) {
			throw toHttpError(error, 'Failed to get prompt type');
		}
	}

	async getPromptTypeByTechName(techName: string): Promise<PromptTypeDto> {
		try {
			const promptType: PromptFormat | null = await this.promptFormatRepo.findOne({ where: { techName } });

			if (!promptType) {
				throw new HttpException(`Prompt type with tech_name="${techName}" not found`, HttpStatus.NOT_FOUND);
			}

			return {
				id: promptType.id,
				name: promptType.name,
				tech_name: promptType.techName,
				tools: [],
			};
		} catch (error) {
			throw toHttpError(error, 'Failed to get prompt type by tech_name');
		}
	}

	async getCategoryById(categoryId: number): Promise<CategoryDto> {
		try {
			const category: Categories | null = await this.categoryRepo.findOne({
				where: { id: categoryId },
				relations: { parent: true },
			});

			if (!category) {
				throw new HttpException(`Category "${categoryId}" not found`, HttpStatus.NOT_FOUND);
			}

			return {
				id: category.id,
				name: category.name,
				tech_name: category.slug,
				parent: category.parent?.id ?? null,
			};
		} catch (error) {
			throw toHttpError(error, 'Failed to get category');
		}
	}

	async getCategoryByName(categoryName: string): Promise<CategoryDto> {
		try {
			const category: Categories | null = await this.categoryRepo
				.createQueryBuilder('c')
				.leftJoinAndSelect('c.parent', 'parent')
				.where('LOWER(c.name) = LOWER(:name)', { name: categoryName.trim() })
				.getOne();

			if (!category) {
				throw new HttpException(`Category "${categoryName}" not found`, HttpStatus.NOT_FOUND);
			}

			return {
				id: category.id,
				name: category.name,
				tech_name: category.slug,
				parent: category.parent?.id ?? null,
			};
		} catch (error) {
			throw toHttpError(error, 'Failed to get category');
		}
	}

	async getSubCategoryByName(name: string): Promise<{ subCategory: CategoryDto; parentCategory: CategoryDto | null }> {
		const subCategory: CategoryDto = await this.getCategoryByName(name);

		let parentCategory: CategoryDto | null = null;
		if (subCategory.parent) {
			parentCategory = await this.getCategoryById(subCategory.parent);
		}

		return { subCategory, parentCategory };
	}

	async getCategories(query: CategoriesQueryDto): Promise<ICategoryItem[]> {
		try {
			const qb: SelectQueryBuilder<Categories> = this.categoryRepo
				.createQueryBuilder('c')
				.leftJoin('c.parent', 'parent')
				.select(['c.id as id', 'c.name as name', 'parent.id as parent']);

			if (query.type === 'parent') {
				qb.where('c.parentId IS NULL');
			} else if (query.type === 'sub') {
				qb.where('c.parentId IS NOT NULL');

				if (query.parentId) {
					qb.andWhere('c.parentId = :parentId', {
						parentId: query.parentId,
					});
				}
			}

			qb.orderBy('c.name', 'ASC');

			const rows: ICategoryRawRow[] = await qb.getRawMany<ICategoryRawRow>();

			return rows.map(
				(r: ICategoryRawRow): ICategoryItem => ({
					id: r.id,
					name: r.name,
					parent: r.parent ?? null,
				}),
			);
		} catch (error) {
			throw toHttpError(error, 'Failed to fetch categories');
		}
	}

	async createCategory(dto: CreateCategoryDto): Promise<ICategoryItem> {
		if (dto.parent != null) {
			const parent: Categories | null = await this.categoryRepo.findOne({
				where: { id: dto.parent },
				relations: { parent: true },
			});

			if (!parent) {
				throw new HttpException('Parent category not found', HttpStatus.NOT_FOUND);
			}
			if (parent.parent != null) {
				throw new HttpException('Parent must be a top-level category', HttpStatus.UNPROCESSABLE_ENTITY);
			}
		}

		const dupQb: SelectQueryBuilder<Categories> = this.categoryRepo
			.createQueryBuilder('c')
			.where('LOWER(c.name) = LOWER(:name)', { name: dto.name });
		if (dto.parent != null) {
			dupQb.andWhere('c.parentId = :parentId', { parentId: dto.parent });
		} else {
			dupQb.andWhere('c.parentId IS NULL');
		}
		const dup: Categories | null = await dupQb.getOne();
		if (dup) {
			throw new HttpException('Category with same name already exists', HttpStatus.CONFLICT);
		}

		try {
			const created: Categories = await this.categoryRepo.save(
				this.categoryRepo.create({
					name: dto.name,
					parent: dto.parent != null ? ({ id: dto.parent } as Categories) : null,
				}),
			);

			return { id: created.id, name: created.name, parent: dto.parent ?? null };
		} catch (error) {
			throw toHttpError(error, 'Failed to create category');
		}
	}

	async getInputFormats(): Promise<IInputFormatItem[]> {
		try {
			const formats: InputFormat[] = await this.inputFormatRepo.find({
				select: ['id', 'name', 'techName'],
				order: { name: 'ASC' },
			});

			return formats
				.filter((f: InputFormat): boolean => Boolean(f.id && f.name))
				.map(
					(f: InputFormat): IInputFormatItem => ({
						id: f.id,
						name: f.name,
						tech_name: f.techName,
					}),
				);
		} catch (error) {
			throw toHttpError(error, 'Failed to fetch input formats');
		}
	}

	async getPromptFormats(): Promise<{ id: number; name: string }[]> {
		const formats: PromptFormat[] = await this.promptFormatRepo.find({
			select: ['id', 'name'],
			order: { name: 'ASC' },
		});

		return formats
			.filter((f: PromptFormat): boolean => Boolean(f.id && f.name))
			.map((f: PromptFormat): { id: number; name: string } => ({
				id: f.id,
				name: f.name,
			}));
	}

	async createOutputType(dto: CreateOutputTypeDto): Promise<OutputTypes> {
		try {
			const existing: OutputTypes | null = await this.outputTypesRepo.findOne({
				where: { name: dto.name },
			});
			if (existing) {
				throw new ConflictException('Output type with same name already exists');
			}
			const createdType: OutputTypes = this.outputTypesRepo.create(dto);
			await this.outputTypesRepo.save(createdType);
			return createdType;
		} catch (error) {
			if (error instanceof ConflictException) throw error;
			throw new InternalServerErrorException('Failed to create output type');
		}
	}

	updateInputFormat(id: number, dto: UpdateNamedTechDto): Promise<InputFormat> {
		return this.patchNamedTech(this.inputFormatRepo, id, dto, 'Input format');
	}

	deleteInputFormat(id: number): Promise<{ success: boolean }> {
		return this.removeById(this.inputFormatRepo, id, 'Input format');
	}

	async listOutputTypes(): Promise<IInputFormatItem[]> {
		try {
			const types: OutputTypes[] = await this.outputTypesRepo.find({
				select: ['id', 'name', 'techName'],
				order: { name: 'ASC' },
			});

			return types
				.filter((type: OutputTypes): boolean => Boolean(type.id && type.name))
				.map(
					(type: OutputTypes): IInputFormatItem => ({
						id: type.id,
						name: type.name,
						tech_name: type.techName,
					}),
				);
		} catch (error) {
			throw toHttpError(error, 'Failed to fetch output types');
		}
	}

	updateOutputType(id: number, dto: UpdateNamedTechDto): Promise<OutputTypes> {
		return this.patchNamedTech(this.outputTypesRepo, id, dto, 'Output type');
	}

	deleteOutputType(id: number): Promise<{ success: boolean }> {
		return this.removeById(this.outputTypesRepo, id, 'Output type');
	}

	updatePromptFormat(id: number, dto: UpdateNamedTechDto): Promise<PromptFormat> {
		return this.patchNamedTech(this.promptFormatRepo, id, dto, 'Prompt format');
	}

	deletePromptFormat(id: number): Promise<{ success: boolean }> {
		return this.removeById(this.promptFormatRepo, id, 'Prompt format');
	}

	async updateCategory(id: number, dto: { name?: string; slug?: string; parent?: number | null }): Promise<Categories> {
		const row = await this.categoryRepo.findOne({ where: { id }, relations: { parent: true } });
		if (!row) throw new HttpException('Category not found', HttpStatus.NOT_FOUND);

		if (dto.name !== undefined) row.name = dto.name;
		if (dto.slug !== undefined) row.slug = dto.slug;
		if ('parent' in dto) {
			row.parent = dto.parent != null ? ({ id: dto.parent } as Categories) : null;
		}
		try {
			return await this.categoryRepo.save(row);
		} catch {
			throw new HttpException('Failed to update category', HttpStatus.BAD_GATEWAY);
		}
	}

	async deleteCategory(id: number): Promise<{ success: boolean }> {
		return this.removeById(this.categoryRepo, id, 'Category');
	}

	async listAudienceTypes(): Promise<AudienceType[]> {
		return this.audienceTypeRepo.find({ order: { name: 'ASC' } });
	}

	async createAudienceType(dto: CreateAudienceTypeDto): Promise<AudienceType> {
		const existing: AudienceType | null = await this.audienceTypeRepo.findOne({ where: { slug: dto.slug } });
		if (existing) {
			throw new HttpException('Audience type with same slug already exists', HttpStatus.CONFLICT);
		}
		try {
			return await this.audienceTypeRepo.save(
				this.audienceTypeRepo.create({ slug: dto.slug, name: this.deriveAudienceTypeName(dto.slug) }),
			);
		} catch {
			throw new HttpException('Failed to create audience type', HttpStatus.BAD_GATEWAY);
		}
	}

	async updateAudienceType(id: number, dto: UpdateAudienceTypeDto): Promise<AudienceType> {
		const row: AudienceType | null = await this.audienceTypeRepo.findOne({ where: { id } });
		if (!row) {
			throw new HttpException('Audience type not found', HttpStatus.NOT_FOUND);
		}
		if (dto.slug && dto.slug !== row.slug) {
			const dup: AudienceType | null = await this.audienceTypeRepo.findOne({ where: { slug: dto.slug } });
			if (dup) {
				throw new HttpException('Audience type with same slug already exists', HttpStatus.CONFLICT);
			}
			row.slug = dto.slug;
			row.name = this.deriveAudienceTypeName(dto.slug);
		}
		try {
			return await this.audienceTypeRepo.save(row);
		} catch {
			throw new HttpException('Failed to update audience type', HttpStatus.BAD_GATEWAY);
		}
	}

	deleteAudienceType(id: number): Promise<{ success: boolean }> {
		return this.removeById(this.audienceTypeRepo, id, 'Audience type');
	}

	private deriveAudienceTypeName(slug: string): string {
		return slug
			.split('-')
			.map((word: string): string => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	private async patchNamedTech<T extends ObjectLiteral & { id: number; name: string; techName: string }>(
		repo: Repository<T>,
		id: number,
		dto: UpdateNamedTechDto,
		label: string,
	): Promise<T> {
		const row: T | null = await repo.findOne({ where: { id } as FindOptionsWhere<T> });
		if (!row) {
			throw new HttpException(`${label} not found`, HttpStatus.NOT_FOUND);
		}

		if (dto.techName !== undefined) {
			const dup: T | null = await repo.findOne({ where: { techName: dto.techName } as FindOptionsWhere<T> });
			if (dup && dup.id !== id) {
				throw new HttpException(`${label} with same techName already exists`, HttpStatus.CONFLICT);
			}
		}

		const fields: Partial<{ name: string; techName: string }> = {};
		if (dto.name !== undefined) fields.name = dto.name;
		if (dto.techName !== undefined) fields.techName = dto.techName;
		repo.merge(row, fields as DeepPartial<T>);

		try {
			return await repo.save(row);
		} catch {
			throw new HttpException(`Failed to update ${label.toLowerCase()}`, HttpStatus.BAD_GATEWAY);
		}
	}

	private async removeById<T extends ObjectLiteral & { id: number }>(
		repo: Repository<T>,
		id: number,
		label: string,
	): Promise<{ success: boolean }> {
		const row: T | null = await repo.findOne({ where: { id } as FindOptionsWhere<T> });
		if (!row) {
			throw new HttpException(`${label} not found`, HttpStatus.NOT_FOUND);
		}

		try {
			await repo.remove(row);
			return { success: true };
		} catch {
			throw new HttpException(`Failed to delete ${label.toLowerCase()}`, HttpStatus.BAD_GATEWAY);
		}
	}
}
