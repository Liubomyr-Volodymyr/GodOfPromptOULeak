import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { aiRequestDto, AIResult, GeneratorAttrs, MakeAiRequestsDto, TaskCreationAttrs, ITaskStatusResponse } from '../dto/generator.dto';
import { Tool } from '../../library/entities/tools.entity';
import { CustomPromptEntity } from '../entities/custom-prompt.entity';
import { AIService } from '../../ai/services/ai.service';
import { TaskEntity } from '../entities/task.entity';
import { GotenbergPdfService } from '../../gotenberg/services/gotenberg-pdf.service';
import { MailerService } from '../../../infra/mailer/services/mailer.service';
import { GoogleDriveService } from '../../google-drive/services/google-drive.service';
import SuccessDto from '../../../common/dto/success.dto';
import { NotionService } from '../../notion/services/notion.service';
import { CsvService } from '../../csv/services/csv.service';
import { GeneratorService } from './generator.service';
import { PROJECT_KEY, TaskStatus } from '../../../common/enums';
import { PromptCreationTypes } from '../../prompts/dto/save-prompt.dto';
import { InternalAiResult } from '../dto/internal-prompts.dto';
import { PromptTypes } from '../../prompts/dto/prompt-types.dto';
import { InputTypesEnum } from '../../prompts/dto/input-types.dto';
import { UsersService } from '../../users/services/users.service';
import { UsageTrackingService } from '../../ai/services/usage-tracking.service';
import { IUsageSummary } from '../../ai/interfaces/usage-tracking.interfaces';
import { PromptsService } from '../../prompts/services/prompts.service';
import { ToolsService } from '../../prompts/services/tools.service';
import { CatalogService } from '../../prompts/services/catalog.service';

@Injectable()
export class CustomGeneratorService {
	constructor(
		@InjectRepository(CustomPromptEntity)
		private customPromptRepository: Repository<CustomPromptEntity>,
		@InjectRepository(TaskEntity)
		private taskRepository: Repository<TaskEntity>,
		private readonly generatorService: GeneratorService,
		private readonly aiService: AIService,
		private readonly gotenbergPdfService: GotenbergPdfService,
		private readonly csvService: CsvService,
		private readonly mailService: MailerService,
		private readonly googleDriveService: GoogleDriveService,
		private readonly notionService: NotionService,
		private readonly promptsService: PromptsService,
		private readonly toolsService: ToolsService,
		private readonly catalogService: CatalogService,
		private readonly contactService: UsersService,
		private readonly usageTracking: UsageTrackingService,
	) {}

	async getTaskStatus(taskId: number): Promise<ITaskStatusResponse> {
		const task = await this.taskRepository.findOne({
			where: { task_id: taskId },
			select: ['task_id', 'done', 'prompt_name', 'page_name', 'prompt_body'],
		});

		if (!task) {
			return { status: TaskStatus.NOT_FOUND };
		}

		if (!task.done) {
			return { status: TaskStatus.PROCESSING };
		}

		return {
			status: TaskStatus.DONE,
			prompt_name: task.prompt_name,
			page_name: task.page_name,
			prompt_body: task.prompt_body,
		};
	}

	async completeTask(dataDto: GeneratorAttrs): Promise<SuccessDto> {
		try {
			console.log(`╭─── Job [Custom Generator] Task ID: ${dataDto.task_id}`);
			const timer = this.generatorService.startTimer();

			const taskDB = await this.taskRepository.findOne({
				where: { task_id: dataDto.task_id },
			});

			console.log(`├─── User: ${taskDB.email}, Prompt: ${taskDB.task.substring(0, 50)}...`);

			const contact = await this.contactService.findUserByEmail(taskDB.email);
			const userId: string = contact?.id || null;

			let time = timer('├─── Notion creation');
			const notionTask = await this.notionService.createMainRecord({
				name: 'Unnamed task',
				spend: dataDto.spend,
				email: taskDB.email,
				task: taskDB.task,
				time,
			});

			const { aiResult, trackingId } = await this.makeAiRequests({
				task_id: taskDB.task_id,
				task: taskDB.task,
				prompt_type: taskDB.prompt_type,
			});
			time = timer('├─── AI requests');

			await this.taskRepository.update(
				{ task_id: dataDto.task_id },
				{
					prompt_name: aiResult['prompt-name'] || '',
					page_name: aiResult['prompt-name'] || '',
					prompt_body: aiResult['prompt-body'] || '',
					done: true,
				},
			);
			console.log(`├─── Task ${dataDto.task_id} is done`);

			await this.notionService.updateDatabase(notionTask.id, {
				name: aiResult['prompt-name'],
				generate: true,
				time,
			});

			const pdfBuffer = await this.gotenbergPdfService.createPDF(aiResult);
			time = timer('├─── PDF creation');
			await this.notionService.updateDatabase(notionTask.id, {
				pdf: true,
				time,
			});

			const csvBuffer = this.csvService.createCSV([
				{
					task: taskDB.task,
					'prompt-name': aiResult['prompt-name'],
					prompt: aiResult['prompt-body'],
				},
			]);
			time = timer('├─── CSV creation');
			await this.notionService.updateDatabase(notionTask.id, {
				csv: true,
				time,
			});

			const pdfPublicUrl = await this.googleDriveService.uploadFile({
				buffer: pdfBuffer,
				extension: 'pdf',
				email: taskDB.email,
				filename: aiResult['prompt-name'],
			});
			const csvPublicUrl = await this.googleDriveService.uploadFile({
				buffer: csvBuffer,
				extension: 'csv',
				email: taskDB.email,
				filename: aiResult['prompt-name'],
			});
			time = timer('├─── Google Drive upload');
			await this.notionService.updateDatabase(notionTask.id, {
				upload: true,
				files: [pdfPublicUrl, csvPublicUrl],
				time,
			});

			await this.mailService.sendMail({
				to: taskDB.email,
				subject: 'Your Custom Prompt Is Ready!',
				template: 'prompt-done',
				context: {
					prompt: aiResult['prompt-body'] || '',
					pdfPublicUrl,
					csvPublicUrl,
				},
			});
			time = timer('├─── Email sending');
			await this.notionService.updateDatabase(notionTask.id, {
				mail: true,
				time,
			});

			await this.notionService.updateDatabase(notionTask.id, {
				done: true,
				time,
			});

			const mappedAiResult: InternalAiResult = this.getMappedAiResultToSavePromptDTO(aiResult);
			const promptTypeId = taskDB.prompt_type || InputTypesEnum.DEFAULT;
			const promptType = await this.catalogService.getPromptTypeById(promptTypeId);
			const promptTypeShort = promptType.tech_name === 'image_prompt' ? 'image' : 'text';
			const outputType = await this.catalogService.getOutputTypeByTechName(promptTypeShort);
			const usageSummary: IUsageSummary = await this.usageTracking.getUsageSummary(trackingId);

			await this.promptsService.saveLibraryPrompt(
				{
					inputType: InputTypesEnum.DEFAULT,
					outputType: outputType[0] || null,
					promptType: promptTypeId,
					inputData: taskDB.task,
					screenshotFileId: null,
					categoryId: null,
					subCategoryId: null,
					aiResult: mappedAiResult,
					dataDto: null,
					user_created: null,
					authorUserId: userId,
					promptCreationType: PromptCreationTypes.CUSTOM,
					generationCost: usageSummary.totalCost,
					generationInputTokens: usageSummary.totalInputTokens,
					generationOutputTokens: usageSummary.totalOutputTokens,
				},
				'custom',
			);

			await this.usageTracking.cleanup(trackingId);
			time = timer('├─── Save to DB');

			console.log(`╰─── Total execution time: ${time}s`);

			return { success: true };
		} catch (error) {
			console.error(error);
			return error;
		}
	}

	private async makeAiRequests(dataDto: MakeAiRequestsDto): Promise<{ aiResult: AIResult; trackingId: string }> {
		const task = dataDto.task;
		const promptTypeId: number = dataDto.prompt_type || PromptTypes.DEFAULT;
		const promptType = await this.catalogService.getPromptTypeById(promptTypeId);

		const toolsRaw: { models_id: number; slug: string }[] = promptType.tools || [];
		let tools: Tool[] = [];

		if (toolsRaw.length > 0) {
			const modelIds: number[] = toolsRaw.map((m: { models_id: number; slug: string }): number => m.models_id);
			tools = await this.toolsService.findByIds(modelIds);
		}

		const aiResult: AIResult = {
			task,
			'task-generator': task,
			'prompt-body': '',
			'how-to-use': '',
			tips: '',
			'prompt-name': '',
			description: '',
			'seo-description': '',
			'what-prompt-does': '',
			icon: '',
			'example-input': '',
			tools: tools,
		};

		const trackingId: string = uuidv4();

		const generatedFields: Record<string, string> = await this.promptsService.generateFieldsFromInstructions(
			task,
			PROJECT_KEY.CUSTOM,
			promptTypeId,
			false,
			trackingId,
		);

		for (const [fieldName, value] of Object.entries(generatedFields)) {
			aiResult[fieldName] = value;
		}

		return { aiResult, trackingId };
	}

	private async doAIRequest(dataDto: aiRequestDto): Promise<string> {
		const { prompt, model } = dataDto.prompt;

		return await this.aiService.addJobRequest({
			model,
			prompt,
			project_key: PROJECT_KEY.CUSTOM,
			priority: 4,
		});
	}

	async dbCreateTask(dataDto: TaskCreationAttrs): Promise<TaskEntity> {
		const task = this.taskRepository.create({
			email: dataDto.email,
			task: dataDto.task,
		});
		return await this.taskRepository.save(task);
	}

	private getMappedAiResultToSavePromptDTO(aiResult: AIResult): InternalAiResult {
		const internalAIResult: InternalAiResult = {
			input: null,
			'prompt-body': (aiResult['prompt-body'] as string) || '',
			icon: (aiResult['icon'] as string) || null,
			'page-name': aiResult['prompt-name'] as string,
			'how-to-use': aiResult['how-to-use'] as string,
			'prompt-name': aiResult['prompt-name'] as string,
			'what-prompt-does': (aiResult['what-prompt-does'] as string) || null,
			description: aiResult.description as string,
			tips: aiResult.tips as string,
			'seo-description': (aiResult['seo-description'] as string) || null,
			html: null,
			'example-input': (aiResult['example-input'] as string) || null,
			'example-output': null,
			tools: (aiResult['tools'] as Tool[]) || [],
		};
		return internalAIResult;
	}
}
