import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { FormatProcessRequest, InputType, InternalAiResult, InternalProcessRequest, OutputType } from '../dto/internal-prompts.dto';
import { DescribeRequest } from '../dto/describe.dto';
import { extractVariableTokens } from '../prompts-generation/dto/prompts-generation.dto';
import { UpdatePromptDto } from '../../prompts/dto/update-prompt.dto';
import { ScreenshotService } from '../../gotenberg/services/gotenberg-screenshots.service';
import { GeneratorService } from './generator.service';
import { PromptTypes } from '../../prompts/dto/prompt-types.dto';
import { PromptsService } from '../../prompts/services/prompts.service';
import { ToolsService } from '../../prompts/services/tools.service';
import { CatalogService } from '../../prompts/services/catalog.service';
import { PromptMediaService } from '../../prompts/services/prompt-media.service';
import { PromptCreationTypes } from '../../prompts/dto/save-prompt.dto';
import { Tool } from '../../library/entities/tools.entity';
import { UsageTrackingService } from '../../ai/services/usage-tracking.service';
import { IUsageSummary } from '../../ai/interfaces/usage-tracking.interfaces';
import { PromptsGenerationService } from '../prompts-generation/services/prompts-generation.service';
import { FieldsGenerationService } from '../fields-generation/services/fields-generation.service';
import { FieldsBranchResult } from '../fields-generation/dto/fields-generation.dto';
import { IFormattedPromptPatch } from '../../prompts/interfaces/formatted-prompt-patch.interface';

@Injectable()
export class InternalGeneratorService {
	constructor(
		private readonly generatorService: GeneratorService,
		private readonly screenshotService: ScreenshotService,
		private readonly promptsService: PromptsService,
		private readonly toolsService: ToolsService,
		private readonly catalogService: CatalogService,
		private readonly promptMediaService: PromptMediaService,
		private readonly usageTracking: UsageTrackingService,
		private readonly promptsGenerationService: PromptsGenerationService,
		private readonly fieldsGenerationService: FieldsGenerationService,
	) {}

	async processInternal(dataDto: InternalProcessRequest): Promise<InternalAiResult> {
		console.log(`├─ Begin Internal generation`);
		console.log(`├─ Author: ${dataDto.author}, input_type: ${dataDto.input_type}, Input: ${dataDto.input.substring(0, 50)}...`);
		const timer = this.generatorService.startTimer();

		const { subCategory, parentCategory } = await this.catalogService.getSubCategoryByName(dataDto.sub_category);
		timer('├─── Resolve sub_category + parent');

		const promptType = await this.catalogService.getPromptTypeByTechName(dataDto.prompt_format);
		timer('├─── Resolve prompt_format');

		const inputTypeRecord = await this.catalogService.getInputFormatByTechName(dataDto.input_type);
		timer('├─── Resolve input_type');

		const tools: Tool[] = await this.toolsService.findBySlugs(dataDto.tools);
		timer('├─── Resolve tools');

		const promptTypeShort: 'image' | 'text' = promptType.tech_name === 'image_prompt' ? 'image' : 'text';

		const trackingId: string = uuidv4();

		const promptsResult = await this.promptsGenerationService.run({
			input: dataDto.input,
			input_type: dataDto.input_type,
			output_type: dataDto.output_type,
			trackingId,
		});
		timer('├─── prompts-generation');

		const fields = await this.fieldsGenerationService.run({
			input: dataDto.input,
			page_name: dataDto.page_name,
			sub_category: dataDto.sub_category,
			prompt_format: dataDto.prompt_format,
			output_type: dataDto.output_type,
			prompt_body: promptsResult.prompt_body,
			variables: promptsResult.variables,
			trackingId,
		});
		timer('├─── fields-generation');

		const fieldsBranch: FieldsBranchResult = { ...fields, tools };

		const aiResult: InternalAiResult = {
			input: dataDto.input,
			'prompt-body': promptsResult.prompt_body,
			'page-name': dataDto.page_name,
			icon: fields.icon,
			'how-to-use': fields['how-to-use'],
			'prompt-name': fields['prompt-name'],
			'what-prompt-does': fields['what-prompt-does'],
			description: fields.description,
			tips: fields.tips,
			'seo-description': fields['seo-description'],
			html: fields.html,
			'example-input': fields['example-input'],
			'example-output': fields['example-output'],
			tools: fieldsBranch.tools,
		};

		let screenshotFileId: string | null = null;
		if (promptType.id === PromptTypes.IMAGE && dataDto.screenshot?.length > 0) {
			screenshotFileId = dataDto.screenshot;
		} else if (aiResult['html']?.length > 0) {
			try {
				const screenshotBuffer = await this.screenshotService.createScreenshot(aiResult['html']);
				timer('├─── Screenshot generation');

				screenshotFileId = await this.promptMediaService.uploadScreenshot(screenshotBuffer);
				timer('├─── Screenshot upload');
			} catch (err) {
				console.warn(`├─── Screenshot skipped (Gotenberg/MinIO unavailable): ${(err as Error).message}`);
				screenshotFileId = null;
			}
		}

		const outputType = await this.catalogService.getOutputTypeByTechName(promptTypeShort);

		const usageSummary: IUsageSummary = await this.usageTracking.getUsageSummary(trackingId);

		await this.promptsService.saveLibraryPrompt(
			{
				categoryId: parentCategory?.id,
				subCategoryId: subCategory.id,
				inputType: inputTypeRecord.id,
				outputType: outputType[0],
				promptType: promptType.id,
				inputData: dataDto.input,
				screenshotFileId,
				aiResult,
				dataDto: { ...dataDto, premium: true } as any,
				user_created: dataDto.author,
				promptCreationType: PromptCreationTypes.INTERNAL,
				source: dataDto.source,
				generationCost: usageSummary.totalCost,
				generationInputTokens: usageSummary.totalInputTokens,
				generationOutputTokens: usageSummary.totalOutputTokens,
			},
			'internal',
		);

		await this.usageTracking.cleanup(trackingId);
		const time = timer('├─── Save prompt');

		console.log(`├─ Total execution time: ${time}s`);

		return aiResult;
	}

	/**
	 * Regenerate the DESCRIBE (guide + SEO) fields for an EXISTING prompt and persist them.
	 * Reuses gop-back's own fields-generation engine against the prompt's current body.
	 */
	async processDescribe(dto: DescribeRequest): Promise<InternalAiResult> {
		console.log(`├─ Begin Describe (regenerate fields) prompt_id=${dto.prompt_id}`);
		const timer = this.generatorService.startTimer();

		const existing = await this.promptsService.getPromptById(dto.prompt_id);
		const trackingId: string = uuidv4();
		const variables: string[] = extractVariableTokens(existing.promptBody);

		const fields = await this.fieldsGenerationService.run({
			input: existing.inputBody ?? existing.promptBody,
			page_name: existing.pageName,
			sub_category: dto.sub_category ?? '',
			prompt_format: dto.prompt_format ?? 'text_prompt',
			output_type: (dto.output_type ?? 'text') as OutputType,
			prompt_body: existing.promptBody,
			variables,
			trackingId,
		});
		timer('├─── fields-generation');

		const patch: UpdatePromptDto = {
			description: fields.description,
			seo_description: fields['seo-description'],
			what_this_prompt_does: fields['what-prompt-does'],
			tips: fields.tips,
			how_to_use_the_prompt: fields['how-to-use'],
			icon: fields.icon,
		};
		await this.promptsService.updatePrompt(dto.prompt_id, patch);
		timer('├─── Persist fields');

		await this.usageTracking.cleanup(trackingId);

		return {
			input: existing.inputBody ?? existing.promptBody,
			'prompt-body': existing.promptBody,
			'page-name': existing.pageName,
			icon: fields.icon,
			'how-to-use': fields['how-to-use'],
			'prompt-name': existing.promptName,
			'what-prompt-does': fields['what-prompt-does'],
			description: fields.description,
			tips: fields.tips,
			'seo-description': fields['seo-description'],
			html: '',
			'example-input': fields['example-input'],
			'example-output': fields['example-output'],
			tools: [],
		};
	}

	async processFormat(dataDto: FormatProcessRequest): Promise<InternalAiResult> {
		if (!dataDto.prompt_id) {
			const createReq: InternalProcessRequest = { ...dataDto, input_type: InputType.READY_PROMPT } as InternalProcessRequest;
			return this.processInternal(createReq);
		}

		console.log(`├─ Begin Format (update) prompt_id=${dataDto.prompt_id}`);

		const existing = await this.promptsService.getPromptById(dataDto.prompt_id);
		const tools: Tool[] = await this.toolsService.findBySlugs(dataDto.tools);

		const { subCategory } = await this.catalogService.getSubCategoryByName(dataDto.sub_category);
		const promptType = await this.catalogService.getPromptTypeByTechName(dataDto.prompt_format);
		const outputType = await this.catalogService.getOutputTypeByTechName(dataDto.output_type);

		// reason: categories.parent_id is unreliable in dev (Budgeting->Positioning & Messaging), so the
		// prompt's existing category_id is left alone rather than re-derived from the sub-category parent.
		// sub_category only fills a gap: callers may send a coarse parent name as a placeholder, which
		// would otherwise overwrite a more specific sub-category already on the prompt.
		const patch: IFormattedPromptPatch = {
			outputTypeId: outputType[0]?.id,
			promptFormat: promptType.id,
			...(existing.subCategoryId == null && { subCategoryId: subCategory.id }),
		};

		const trackingId: string = uuidv4();
		const promptsResult = await this.promptsGenerationService.run({
			input: dataDto.input,
			input_type: InputType.READY_PROMPT,
			output_type: dataDto.output_type,
			trackingId,
		});

		await this.promptsService.updateFormattedPrompt(dataDto.prompt_id, promptsResult.prompt_body, tools, patch);
		await this.usageTracking.cleanup(trackingId);

		const aiResult: InternalAiResult = {
			input: dataDto.input,
			'prompt-body': promptsResult.prompt_body,
			icon: existing.icon ?? '',
			'page-name': existing.pageName,
			'how-to-use': existing.howToUseThePrompt ?? '',
			'prompt-name': existing.promptName,
			'what-prompt-does': existing.whatThisPromptDoes ?? '',
			description: existing.description ?? '',
			tips: existing.tips ?? '',
			'seo-description': existing.seoDescription ?? '',
			html: '',
			'example-input': '',
			'example-output': '',
			tools,
		};

		return aiResult;
	}
}
