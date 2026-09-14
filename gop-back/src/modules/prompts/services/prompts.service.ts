import { HttpException, HttpStatus, Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { PromptsDto } from '../dto/prompts.dto';
import { Prompts, PromptStatusEnum } from '../../library/entities/prompts.entity';
import { OutputTypeId } from '../../user-products/entities/output-types.entity';
import { AIService } from '../../ai/services/ai.service';
import { ModelIdDto, SavePromptDto } from '../dto/save-prompt.dto';
import { Tool } from '../../library/entities/tools.entity';
import { PromptsTools } from '../../library/entities/prompts-tools.entity';
import { PromptsAudienceTypes } from '../../library/entities/prompts-audience-types.entity';
import { AudienceType } from '../../library/entities/audience-type.entity';
import { Author } from '../../library/entities/authors.entity';
import { Source } from '../../library/entities/sources.entity';
import { AddPromptToDbDto } from '../../generator/dto/add-to-db.dto';
import { PromptFieldAiInstructionDto } from '../dto/prompt-field-ai-instructions.dto';
import { PROJECT_KEY } from '../../../common/enums';
import { PromptFieldAiInstructions } from '../../generator/entities/prompt-field-ai-instructions.entity';
import { SyncPromptsDto } from '../../qdrant/dto/qdrant.dto';
import { QdrantService } from '../../qdrant/services/qdrant.service';
import { UpdatePromptDto } from '../dto/update-prompt.dto';
import { CreatePromptDto } from '../dto/create-prompt.dto';
import { IFormattedPromptPatch } from '../interfaces/formatted-prompt-patch.interface';

type FieldAiInstructionRawRow = {
	id: number;
	prompt_format: number;
	field_name: string;
	instructions: string;

	tool_id: number | null;
	tool_slug: string | null;
	tool_name: string | null;
};

@Injectable()
export class PromptsService {
	constructor(
		@InjectRepository(Prompts)
		private readonly promptRepo: Repository<Prompts>,
		@InjectRepository(Tool)
		private readonly toolsRepo: Repository<Tool>,
		@InjectRepository(PromptsAudienceTypes)
		private readonly promptAudienceTypesRepo: Repository<PromptsAudienceTypes>,
		@InjectRepository(PromptFieldAiInstructions)
		private readonly promptFieldAiInstructionsRepo: Repository<PromptFieldAiInstructions>,
		private readonly dataSource: DataSource,
		private readonly aiService: AIService,
		@Inject(forwardRef(() => QdrantService))
		private readonly qdrantService: QdrantService,
	) {}

	async getPromptsByIds(ids: string[]): Promise<PromptsDto[]> {
		try {
			if (!ids?.length) return [];

			const prompts: Prompts[] = await this.promptRepo
				.createQueryBuilder('p')
				.leftJoinAndSelect('p.category', 'c')
				.leftJoinAndSelect('p.subCategory', 'sc')
				.leftJoinAndSelect('p.outputType', 'ot')
				.select([
					'p.id',
					'p.pageName',
					'p.slug',
					'p.isPremium',
					'c.id',
					'c.name',
					'c.slug',
					'sc.id',
					'sc.name',
					'sc.slug',
					'ot.techName',
				])
				.where('p.id IN (:...ids)', { ids })
				.getMany();

			return prompts.map(
				(prompt: Prompts): PromptsDto => ({
					id: prompt.id,
					page_name: prompt.pageName,
					slug: prompt.slug,
					premium: prompt.isPremium,
					category: {
						id: prompt.category.id,
						name: prompt.category.name,
						slug: prompt.category.slug,
					},
					sub_category: {
						id: prompt.subCategory.id,
						name: prompt.subCategory.name,
						slug: prompt.subCategory.slug,
					},
					output_type: prompt.outputType?.techName ?? null,
				}),
			);
		} catch (e) {
			throw new HttpException('Failed to get prompts by ids', HttpStatus.BAD_GATEWAY);
		}
	}

	async getPrompts(dataDto: SyncPromptsDto) {
		try {
			const qb = this.promptRepo
				.createQueryBuilder('p')
				.select(['p.id', 'p.category_id', 'p.sub_category_id', 'p.page_name', 'p.description', 'p.prompt_body', 'p.date_updated'])
				.where('p.status = :status', { status: 'published' });

			if (dataDto.dateUpdatedGte) {
				qb.andWhere('p.date_updated >= :date', {
					date: dataDto.dateUpdatedGte,
				});
			}

			if (dataDto.limit) {
				qb.limit(dataDto.limit);
			}

			if (dataDto.page) {
				qb.offset((dataDto.page - 1) * dataDto.limit);
			}

			qb.orderBy('p.date_updated', 'ASC');

			return await qb.getMany();
		} catch (e) {
			throw new HttpException('Failed to fetch prompts', HttpStatus.BAD_GATEWAY);
		}
	}

	async parseAiModelsResponse(aiModelsString: string): Promise<ModelIdDto[]> {
		try {
			if (!aiModelsString || aiModelsString.trim() === '') {
				return [];
			}

			const requestedModels = aiModelsString
				.split('&')
				.map((model) => model.trim())
				.filter((model) => model.length > 0);
			if (requestedModels.length === 0) {
				return [];
			}

			const allModels = await this.getAllModels();
			const matchedModels = allModels.filter((model) => requestedModels.includes(model.slug));

			return matchedModels.map((model) => ({ models_id: model.id }));
		} catch (error) {
			console.error('Failed to parse AI models response:', error);
			return [];
		}
	}

	async getAllModels(): Promise<{ id: number; slug: string }[]> {
		try {
			return await this.toolsRepo.createQueryBuilder('m').select(['m.id AS id', 'm.slug AS slug']).getRawMany();
		} catch (error) {
			throw new HttpException('Failed to fetch models', HttpStatus.BAD_GATEWAY);
		}
	}

	async getFieldAiInstructions(promptFormatId?: number): Promise<PromptFieldAiInstructionDto[]> {
		try {
			const qb = this.promptFieldAiInstructionsRepo
				.createQueryBuilder('pfai')
				.select([
					'pfai.id AS id',
					'pfai.prompt_format AS prompt_format',
					'pfai.field_name AS field_name',
					'pfai.instructions AS instructions',

					'rt.id AS tool_id',
					'rt.slug AS tool_slug',
					'rt.name AS tool_name',
				])
				.leftJoin('tools', 'rt', 'rt.id = pfai.tool_id');

			if (promptFormatId) {
				qb.where('pfai.prompt_format = :promptFormatId', {
					promptFormatId,
				});
			}

			const rows = await qb.getRawMany<FieldAiInstructionRawRow>();

			return rows.map(this.mapRowToDto);
		} catch {
			throw new HttpException('Failed to get field AI instructions', HttpStatus.BAD_GATEWAY);
		}
	}

	getModelFromInstruction(instruction: PromptFieldAiInstructionDto): string | null {
		const tool: PromptFieldAiInstructionDto['tool'] = instruction.tool;

		if (!tool) {
			return null;
		}

		return tool.slug || null;
	}

	async generateFieldsFromInstructions(
		input: string,
		projectKey: PROJECT_KEY,
		promptFormatId?: number,
		isPremium?: boolean,
		trackingId?: string,
	): Promise<Record<string, string>> {
		const instructions: PromptFieldAiInstructionDto[] = await this.getFieldAiInstructions(promptFormatId);
		const result: Record<string, string> = {};

		const entries = await Promise.all(
			instructions.map(async (instruction) => {
				const fieldName: string = instruction.fieldName;

				let aiInstruction: string = instruction.instruction;
				let usedPremiumInstruction: boolean = false;
				if (isPremium && instruction.instructionPremium) {
					aiInstruction = instruction.instructionPremium;
					usedPremiumInstruction = true;
				}

				const model: string | null = this.getModelFromInstruction(instruction);
				const modelToUse: string = model || 'gpt-4o';
				const prompt: string = `${aiInstruction}\n\nTask: ${input}`;

				console.log(
					`├─ Field "${fieldName}": model="${modelToUse}", instruction=${usedPremiumInstruction ? 'premium' : 'standard'}`,
				);

				const response: string = await this.aiService.addJobRequest({
					prompt,
					model: modelToUse,
					project_key: projectKey,
					trackingId,
					fieldName,
				});

				return [fieldName, response] as const;
			}),
		);

		for (const [key, value] of entries) {
			result[key] = value;
		}

		return result;
	}

	async saveLibraryPrompt(dataDto: SavePromptDto, promptType: 'custom' | 'internal') {
		const queryRunner = this.dataSource.createQueryRunner();

		await queryRunner.connect();
		await queryRunner.startTransaction();

		try {
			const slug = await this.processSlug(dataDto.aiResult['page-name']);

			const promptInsertResult = await queryRunner.manager
				.createQueryBuilder()
				.insert()
				.into(Prompts)
				.values({
					status: PromptStatusEnum.PENDING,
					categoryId: dataDto.categoryId,
					subCategoryId: dataDto.subCategoryId,
					outputTypeId: dataDto.outputType?.id as OutputTypeId,
					icon: dataDto.aiResult['icon'],
					exampleOutputUrl: dataDto.screenshotFileId,
					pageName: dataDto.aiResult['page-name'],
					slug,
					description: dataDto.aiResult.description,
					whatThisPromptDoes: dataDto.aiResult['what-prompt-does'],
					tips: dataDto.aiResult.tips,
					promptName: dataDto.aiResult['prompt-name'],
					promptBody: dataDto.aiResult['prompt-body'],
					howToUseThePrompt: dataDto.aiResult['how-to-use'],
					seoDescription: dataDto.aiResult['seo-description'],

					likesCount: 0,
					viewsCount: 0,
					uniqueViewsCount: 0,
					bookmarksCount: 0,

					isPremium: (dataDto.dataDto as any)?.premium ?? false,
					dateCreated: new Date(),
					datePublished: new Date(),

					inputFormatId: dataDto.inputType,
					promptFormatId: dataDto.promptType,
					inputBody: dataDto.inputData,

					moderatorId: promptType === 'internal' ? dataDto.user_created : null,
					userId: promptType === 'custom' ? dataDto.authorUserId : null,

					...(dataDto.generationCost != null && {
						generationCost: String(dataDto.generationCost),
					}),
					...(dataDto.generationInputTokens != null && {
						generationInputTokens: dataDto.generationInputTokens,
					}),
					...(dataDto.generationOutputTokens != null && {
						generationOutputTokens: dataDto.generationOutputTokens,
					}),
				})
				.returning('id')
				.execute();

			const promptId = promptInsertResult.raw[0].id;

			const aiTools: Tool[] = (dataDto.aiResult['tools'] as Tool[]) || [];
			const toolIds: number[] = aiTools.filter((m: Tool): boolean => m.id != null).map((m: Tool): number => m.id);

			if (toolIds.length) {
				const values: Array<{ prompt: { id: string }; tool: { id: number } }> = toolIds.map((toolId: number) => ({
					prompt: { id: promptId },
					tool: { id: toolId },
				}));

				await queryRunner.manager.createQueryBuilder().insert().into(PromptsTools).values(values).orIgnore().execute();
			}

			await queryRunner.commitTransaction();

			return { id: promptId };
		} catch (e) {
			await queryRunner.rollbackTransaction();

			throw new HttpException('Failed to save prompt', HttpStatus.BAD_GATEWAY);
		} finally {
			await queryRunner.release();
		}
	}

	async insertReadyPrompt(dto: AddPromptToDbDto): Promise<{ id: string }> {
		const toolIds: number[] = [];
		if (dto.tools?.length) {
			const tools: Tool[] = await this.toolsRepo.find();
			const idBySlug = new Map<string, number>();
			for (const t of tools) {
				idBySlug.set(t.slug, t.id);
			}
			const missing: string[] = [];
			for (const slug of dto.tools) {
				const id: number | undefined = idBySlug.get(slug);
				if (id === undefined) {
					missing.push(slug);
				} else {
					toolIds.push(id);
				}
			}
			if (missing.length) {
				throw new HttpException(`Unknown tool slugs: ${missing.join(', ')}`, HttpStatus.BAD_REQUEST);
			}
		}

		const audienceTypeIds: number[] = [];
		if (dto.audience_types?.length) {
			const audienceTypes: AudienceType[] = await this.dataSource.getRepository(AudienceType).find();
			const idBySlug: Map<string, number> = new Map<string, number>(
				audienceTypes.map((audienceType: AudienceType): [string, number] => [audienceType.slug, audienceType.id]),
			);
			const missingAudienceTypeSlugs: string[] = [];
			for (const slug of dto.audience_types) {
				const audienceTypeId: number | undefined = idBySlug.get(slug);
				if (audienceTypeId === undefined) {
					missingAudienceTypeSlugs.push(slug);
				} else {
					audienceTypeIds.push(audienceTypeId);
				}
			}
			if (missingAudienceTypeSlugs.length) {
				throw new HttpException(`Unknown audience type slugs: ${missingAudienceTypeSlugs.join(', ')}`, HttpStatus.BAD_REQUEST);
			}
		}

		const queryRunner = this.dataSource.createQueryRunner();
		await queryRunner.connect();
		await queryRunner.startTransaction();

		try {
			if (dto.author_id !== undefined) {
				const existing: Author | null = await queryRunner.manager.getRepository(Author).findOne({ where: { id: dto.author_id } });
				if (!existing) {
					if (!dto.author_name) {
						throw new HttpException(`author ${dto.author_id} not found; pass author_name to create it`, HttpStatus.BAD_REQUEST);
					}
					await queryRunner.manager
						.getRepository(Author)
						.upsert({ id: dto.author_id, name: dto.author_name }, { conflictPaths: ['id'] });
				}
			}

			if (dto.source_id !== undefined) {
				const existing: Source | null = await queryRunner.manager.getRepository(Source).findOne({ where: { id: dto.source_id } });
				if (!existing) {
					if (!dto.source_name) {
						throw new HttpException(`source ${dto.source_id} not found; pass source_name to create it`, HttpStatus.BAD_REQUEST);
					}
					await queryRunner.manager
						.getRepository(Source)
						.upsert({ id: dto.source_id, name: dto.source_name }, { conflictPaths: ['id'] });
				}
			}

			const existingPrompt: Prompts | null = await queryRunner.manager.getRepository(Prompts).findOne({ where: { slug: dto.slug } });

			let saved: Prompts;
			if (existingPrompt) {
				queryRunner.manager.getRepository(Prompts).merge(existingPrompt, this.mapPromptFields(dto));
				if (dto.date_created !== undefined) {
					existingPrompt.dateCreated = new Date(dto.date_created);
				}
				saved = await queryRunner.manager.getRepository(Prompts).save(existingPrompt);
			} else {
				const payload: Partial<Prompts> = {
					slug: dto.slug,
					pageName: dto.page_name,
					promptName: dto.prompt_name,
					promptBody: dto.prompt_body,
					outputTypeId: dto.output_type_id as OutputTypeId,
					icon: dto.icon ?? null,
					categoryId: dto.category_id ?? null,
					subCategoryId: dto.sub_category_id ?? null,
					promptFormatId: dto.prompt_format ?? null,
					inputFormatId: dto.input_format ?? null,
					isPremium: dto.is_premium ?? false,
					status: PromptStatusEnum.PENDING,
					dateCreated: dto.date_created ? new Date(dto.date_created) : new Date(),
					datePublished: dto.date_published ? new Date(dto.date_published) : null,
					description: dto.description ?? null,
					whatThisPromptDoes: dto.what_this_prompt_does ?? null,
					tips: dto.tips ?? null,
					howToUseThePrompt: dto.how_to_use_the_prompt ?? null,
					seoDescription: dto.seo_description ?? null,
					inputBody: dto.input_body ?? null,
					exampleOutputUrl: dto.example_output_url ?? null,
					exampleOutputEmbed: dto.example_output_embed ?? null,
					authorId: dto.author_id ?? null,
					sourceId: dto.source_id ?? null,
					likesCount: 0,
					viewsCount: 0,
					uniqueViewsCount: 0,
					bookmarksCount: 0,
					moderatorId: null,
					userId: null,
				};
				saved = await queryRunner.manager.getRepository(Prompts).save(payload);
			}

			if (dto.tools !== undefined) {
				await queryRunner.manager
					.createQueryBuilder()
					.delete()
					.from(PromptsTools)
					.where('prompts_id = :id', { id: saved.id })
					.execute();

				if (toolIds.length) {
					const values: Array<{ prompt: { id: string }; tool: { id: number } }> = toolIds.map((toolId: number) => ({
						prompt: { id: saved.id },
						tool: { id: toolId },
					}));
					await queryRunner.manager.createQueryBuilder().insert().into(PromptsTools).values(values).orIgnore().execute();
				}
			}

			if (dto.audience_types !== undefined) {
				await queryRunner.manager
					.createQueryBuilder()
					.delete()
					.from(PromptsAudienceTypes)
					.where('prompt_id = :id', { id: saved.id })
					.execute();

				if (audienceTypeIds.length) {
					const values: Array<{ prompt: { id: string }; audienceType: { id: number } }> = audienceTypeIds.map(
						(audienceTypeId: number) => ({
							prompt: { id: saved.id },
							audienceType: { id: audienceTypeId },
						}),
					);
					await queryRunner.manager.createQueryBuilder().insert().into(PromptsAudienceTypes).values(values).orIgnore().execute();
				}
			}

			await queryRunner.commitTransaction();

			return { id: saved.id };
		} catch (e) {
			await queryRunner.rollbackTransaction();
			if (e instanceof HttpException) {
				throw e;
			}
			throw new HttpException('Failed to add prompt', HttpStatus.BAD_GATEWAY);
		} finally {
			await queryRunner.release();
		}
	}

	async updatePrompt(id: string, dto: UpdatePromptDto): Promise<Prompts> {
		const queryRunner = this.dataSource.createQueryRunner();
		await queryRunner.connect();
		await queryRunner.startTransaction();

		try {
			const prompt: Prompts | null = await queryRunner.manager.getRepository(Prompts).findOne({ where: { id } });
			if (!prompt) {
				throw new HttpException('Prompt not found', HttpStatus.NOT_FOUND);
			}
			const previousPromotsStatus: PromptStatusEnum = prompt.status;

			if (dto.slug !== undefined) {
				const dup: Prompts | null = await queryRunner.manager
					.getRepository(Prompts)
					.createQueryBuilder('p')
					.where('p.slug = :slug', { slug: dto.slug })
					.andWhere('p.id != :id', { id })
					.getOne();
				if (dup) {
					throw new HttpException('Prompt with same slug already exists', HttpStatus.CONFLICT);
				}
			}

			let toolIds: number[] | null = null;
			if (dto.tools !== undefined) {
				toolIds = [];
				if (dto.tools.length) {
					const tools: Tool[] = await queryRunner.manager.getRepository(Tool).find();
					const idBySlug: Map<string, number> = new Map<string, number>(tools.map((t: Tool): [string, number] => [t.slug, t.id]));
					const missing: string[] = [];
					for (const slug of dto.tools) {
						const toolId: number | undefined = idBySlug.get(slug);
						if (toolId === undefined) missing.push(slug);
						else toolIds.push(toolId);
					}
					if (missing.length) {
						throw new HttpException(`Unknown tool slugs: ${missing.join(', ')}`, HttpStatus.BAD_REQUEST);
					}
				}
			}

			queryRunner.manager.getRepository(Prompts).merge(prompt, this.mapPromptFields(dto));
			const saved: Prompts = await queryRunner.manager.getRepository(Prompts).save(prompt);

			if (toolIds !== null) {
				await queryRunner.manager.createQueryBuilder().delete().from(PromptsTools).where('prompts_id = :id', { id }).execute();
				if (toolIds.length) {
					const values: Array<{ prompt: { id: string }; tool: { id: number } }> = toolIds.map((toolId: number) => ({
						prompt: { id },
						tool: { id: toolId },
					}));
					await queryRunner.manager.createQueryBuilder().insert().into(PromptsTools).values(values).orIgnore().execute();
				}
			}

			if (dto.audience_type_ids !== undefined) {
				await queryRunner.manager
					.createQueryBuilder()
					.delete()
					.from(PromptsAudienceTypes)
					.where('prompt_id = :id', { id })
					.execute();
				if (dto.audience_type_ids.length) {
					const values = dto.audience_type_ids.map((atId: number) => ({
						prompt: { id },
						audienceType: { id: atId },
					}));
					await queryRunner.manager.createQueryBuilder().insert().into(PromptsAudienceTypes).values(values).orIgnore().execute();
				}
			}

			await queryRunner.commitTransaction();

			if (previousPromotsStatus !== PromptStatusEnum.PUBLISHED && saved.status === PromptStatusEnum.PUBLISHED) {
				console.log(`Prompt: ${saved.slug} is now published -> QDrant vectorize`);
				await this.qdrantService.addData({
					id: saved.id,
					category: saved.categoryId,
					sub_category: saved.subCategoryId,
					fields: {
						page_name: saved.pageName,
						prompt_body: saved.promptBody,
						description: saved.description,
					},
				});
			}

			return saved;
		} catch (e) {
			await queryRunner.rollbackTransaction();
			if (e instanceof HttpException) throw e;
			throw new HttpException('Failed to update prompt', HttpStatus.BAD_GATEWAY);
		} finally {
			await queryRunner.release();
		}
	}

	async createPrompt(dto: CreatePromptDto): Promise<Prompts> {
		const queryRunner = this.dataSource.createQueryRunner();
		await queryRunner.connect();
		await queryRunner.startTransaction();
		try {
			const dup = await queryRunner.manager.getRepository(Prompts).findOne({ where: { slug: dto.slug } });
			if (dup) {
				throw new HttpException('Prompt with same slug already exists', HttpStatus.CONFLICT);
			}

			const prompt = queryRunner.manager.getRepository(Prompts).create({
				slug: dto.slug,
				pageName: dto.page_name,
				promptName: dto.prompt_name,
				promptBody: dto.prompt_body,
				outputTypeId: dto.output_type_id as OutputTypeId,
				status: dto.status,
				dateCreated: new Date(),
				icon: dto.icon ?? null,
				categoryId: dto.category_id ?? null,
				subCategoryId: dto.sub_category_id ?? null,
				promptFormatId: dto.prompt_format ?? null,
				inputFormatId: dto.input_format ?? null,
				isPremium: dto.is_premium ?? false,
				description: dto.description ?? null,
				whatThisPromptDoes: dto.what_this_prompt_does ?? null,
				tips: dto.tips ?? null,
				howToUseThePrompt: dto.how_to_use_the_prompt ?? null,
				seoDescription: dto.seo_description ?? null,
				inputBody: dto.input_body ?? null,
				exampleOutputUrl: dto.example_output_url ?? null,
				exampleOutputEmbed: dto.example_output_embed ?? null,
				authorId: dto.author_id ?? null,
				sourceId: dto.source_id ?? null,
			});
			const saved = await queryRunner.manager.getRepository(Prompts).save(prompt);

			if (dto.tools?.length) {
				const tools = await queryRunner.manager.getRepository(Tool).find();
				const idBySlug = new Map<string, number>(tools.map((t) => [t.slug, t.id]));
				const missing = dto.tools.filter((s) => !idBySlug.has(s));
				if (missing.length) throw new HttpException(`Unknown tool slugs: ${missing.join(', ')}`, HttpStatus.BAD_REQUEST);
				const toolValues = dto.tools.map((s) => ({ prompt: { id: saved.id }, tool: { id: idBySlug.get(s) } }));
				await queryRunner.manager.createQueryBuilder().insert().into(PromptsTools).values(toolValues).orIgnore().execute();
			}

			const audienceTypeIds: Set<number> = new Set<number>(dto.audience_type_ids ?? []);
			if (dto.audience_types?.length) {
				const audienceTypes: AudienceType[] = await queryRunner.manager.getRepository(AudienceType).find();
				const idBySlug: Map<string, number> = new Map<string, number>(
					audienceTypes.map((audienceType: AudienceType): [string, number] => [audienceType.slug, audienceType.id]),
				);
				const missingAudienceTypeSlugs: string[] = [];
				for (const slug of dto.audience_types) {
					const audienceTypeId: number | undefined = idBySlug.get(slug);
					if (audienceTypeId === undefined) {
						missingAudienceTypeSlugs.push(slug);
					} else {
						audienceTypeIds.add(audienceTypeId);
					}
				}
				if (missingAudienceTypeSlugs.length) {
					throw new HttpException(`Unknown audience type slugs: ${missingAudienceTypeSlugs.join(', ')}`, HttpStatus.BAD_REQUEST);
				}
			}

			if (audienceTypeIds.size) {
				const values: Array<{ prompt: { id: string }; audienceType: { id: number } }> = [...audienceTypeIds].map(
					(audienceTypeId: number) => ({
						prompt: { id: saved.id },
						audienceType: { id: audienceTypeId },
					}),
				);
				await queryRunner.manager.createQueryBuilder().insert().into(PromptsAudienceTypes).values(values).orIgnore().execute();
			}

			await queryRunner.commitTransaction();
			return saved;
		} catch (e) {
			await queryRunner.rollbackTransaction();
			if (e instanceof HttpException) throw e;
			throw new HttpException('Failed to create prompt', HttpStatus.BAD_GATEWAY);
		} finally {
			await queryRunner.release();
		}
	}

	async addAudienceType(promptId: string, audienceTypeId: number): Promise<{ success: boolean }> {
		const prompt = await this.promptRepo.findOne({ where: { id: promptId } });
		if (!prompt) throw new HttpException('Prompt not found', HttpStatus.NOT_FOUND);

		const existing = await this.promptAudienceTypesRepo.findOne({
			where: { prompt: { id: promptId }, audienceType: { id: audienceTypeId } },
		});
		if (existing) throw new HttpException('Audience type already tagged on this prompt', HttpStatus.CONFLICT);

		try {
			await this.promptAudienceTypesRepo.save(
				this.promptAudienceTypesRepo.create({ prompt: { id: promptId }, audienceType: { id: audienceTypeId } as AudienceType }),
			);
			return { success: true };
		} catch {
			throw new HttpException('Failed to add audience type', HttpStatus.BAD_GATEWAY);
		}
	}

	async removeAudienceType(promptId: string, audienceTypeId: number): Promise<{ success: boolean }> {
		const row = await this.promptAudienceTypesRepo.findOne({
			where: { prompt: { id: promptId }, audienceType: { id: audienceTypeId } },
		});
		if (!row) throw new HttpException('Audience type not tagged on this prompt', HttpStatus.NOT_FOUND);

		try {
			await this.promptAudienceTypesRepo.remove(row);
			return { success: true };
		} catch {
			throw new HttpException('Failed to remove audience type', HttpStatus.BAD_GATEWAY);
		}
	}

	async deletePrompt(id: string): Promise<{ success: boolean }> {
		const prompt: Prompts | null = await this.promptRepo.findOne({ where: { id } });
		if (!prompt) {
			throw new HttpException('Prompt not found', HttpStatus.NOT_FOUND);
		}

		try {
			await this.promptRepo.remove(prompt);
			return { success: true };
		} catch {
			throw new HttpException('Failed to delete prompt', HttpStatus.BAD_GATEWAY);
		}
	}

	private mapPromptFields(dto: UpdatePromptDto | AddPromptToDbDto): Partial<Prompts> {
		const fields: Partial<Prompts> = {};
		if (dto.slug !== undefined) fields.slug = dto.slug;
		if (dto.page_name !== undefined) fields.pageName = dto.page_name;
		if (dto.prompt_name !== undefined) fields.promptName = dto.prompt_name;
		if (dto.prompt_body !== undefined) fields.promptBody = dto.prompt_body;
		if (dto.output_type_id !== undefined) fields.outputTypeId = dto.output_type_id as OutputTypeId;
		if (dto.icon !== undefined) fields.icon = dto.icon ?? null;
		if (dto.category_id !== undefined) fields.categoryId = dto.category_id ?? null;
		if (dto.sub_category_id !== undefined) fields.subCategoryId = dto.sub_category_id ?? null;
		if (dto.prompt_format !== undefined) fields.promptFormatId = dto.prompt_format ?? null;
		if (dto.input_format !== undefined) fields.inputFormatId = dto.input_format ?? null;
		if (dto.is_premium !== undefined) fields.isPremium = dto.is_premium;
		if (dto.status !== undefined) fields.status = dto.status;
		if (dto.date_published !== undefined) fields.datePublished = dto.date_published ? new Date(dto.date_published) : null;
		if (dto.description !== undefined) fields.description = dto.description ?? null;
		if (dto.what_this_prompt_does !== undefined) fields.whatThisPromptDoes = dto.what_this_prompt_does ?? null;
		if (dto.tips !== undefined) fields.tips = dto.tips ?? null;
		if (dto.how_to_use_the_prompt !== undefined) fields.howToUseThePrompt = dto.how_to_use_the_prompt ?? null;
		if (dto.seo_description !== undefined) fields.seoDescription = dto.seo_description ?? null;
		if (dto.input_body !== undefined) fields.inputBody = dto.input_body ?? null;
		if (dto.example_output_url !== undefined) fields.exampleOutputUrl = dto.example_output_url ?? null;
		if (dto.example_output_embed !== undefined) fields.exampleOutputEmbed = dto.example_output_embed ?? null;
		if (dto.author_id !== undefined) fields.authorId = dto.author_id ?? null;
		if (dto.source_id !== undefined) fields.sourceId = dto.source_id ?? null;
		return fields;
	}

	async getPromptById(id: string): Promise<Prompts> {
		const prompt: Prompts | null = await this.promptRepo.findOne({ where: { id } });
		if (!prompt) {
			throw new HttpException(`Prompt not found: ${id}`, HttpStatus.NOT_FOUND);
		}
		return prompt;
	}

	async updateFormattedPrompt(id: string, promptBody: string, tools: Tool[], patch?: IFormattedPromptPatch): Promise<void> {
		const queryRunner = this.dataSource.createQueryRunner();

		await queryRunner.connect();
		await queryRunner.startTransaction();

		try {
			await queryRunner.manager.update(
				Prompts,
				{ id },
				{
					promptBody,
					dateUpdated: new Date(),
					...(patch?.outputTypeId != null && { outputTypeId: patch.outputTypeId as OutputTypeId }),
					...(patch?.promptFormat != null && { promptFormatId: patch.promptFormat }),
					...(patch?.subCategoryId != null && { subCategoryId: patch.subCategoryId }),
					...(patch?.categoryId !== undefined && { categoryId: patch.categoryId }),
				},
			);

			await queryRunner.manager.createQueryBuilder().delete().from(PromptsTools).where('prompts_id = :id', { id }).execute();

			const toolIds: number[] = tools.filter((t: Tool): boolean => t.id != null).map((t: Tool): number => t.id);
			if (toolIds.length) {
				const values: Array<{ prompt: { id: string }; tool: { id: number } }> = toolIds.map((toolId: number) => ({
					prompt: { id },
					tool: { id: toolId },
				}));
				await queryRunner.manager.createQueryBuilder().insert().into(PromptsTools).values(values).orIgnore().execute();
			}

			await queryRunner.commitTransaction();
		} catch (e) {
			await queryRunner.rollbackTransaction();
			throw new HttpException('Failed to update formatted prompt', HttpStatus.BAD_GATEWAY);
		} finally {
			await queryRunner.release();
		}
	}

	private async processSlug(pageName: string): Promise<string> {
		let baseSlug = pageName
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.trim()
			.replace(/^-+|-+$/g, '');

		if (!baseSlug) {
			baseSlug = 'prompt';
		}

		let finalSlug = baseSlug;
		let counter = 1;

		while (await this.isSlugExists(finalSlug)) {
			counter++;
			const lastDashIndex = baseSlug.lastIndexOf('-');
			const lastPart = baseSlug.substring(lastDashIndex + 1);

			if (/^\d+$/.test(lastPart)) {
				const numberPart = parseInt(lastPart);
				const basePart = baseSlug.substring(0, lastDashIndex);
				finalSlug = `${basePart}-${numberPart + counter - 1}`;
			} else {
				finalSlug = `${baseSlug}-${counter}`;
			}
		}

		return finalSlug;
	}

	private mapRowToDto(row: FieldAiInstructionRawRow): PromptFieldAiInstructionDto {
		return {
			id: row.id,
			promptFormatId: row.prompt_format,
			fieldName: row.field_name,
			instruction: row.instructions,
			tool: row.tool_id
				? {
						id: row.tool_id,
						slug: row.tool_slug,
						name: row.tool_name,
					}
				: null,
		};
	}

	private async isSlugExists(slug: string): Promise<boolean> {
		try {
			const exists = await this.promptRepo.exist({
				where: { slug },
			});

			return exists;
		} catch {
			throw new HttpException('Failed to check slug existence', HttpStatus.BAD_GATEWAY);
		}
	}
}
