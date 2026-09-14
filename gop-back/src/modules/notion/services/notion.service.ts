import { BadRequestException, Injectable } from '@nestjs/common';
import { Client } from '@notionhq/client';
import { CreatePageResponse } from '@notionhq/client/build/src/api-endpoints';
import {
	NotionTaskCreateDto,
	UpdateData,
	GetDbOptionsDto,
	NotionRowsDto,
} from '../dto/notion.dto';
import dayjs from 'dayjs';
import { isFullPage } from '@notionhq/client';
import { NotionPageProperties } from '../interfaces/notion.interface';
import { UpdatePageParameters } from '@notionhq/client/build/src/api-endpoints';
import { NotionClientService } from './notion-client.service';

@Injectable()
export class NotionService {
	private readonly notion: Client;

	constructor(private readonly notionClientService: NotionClientService) {
		this.notion = this.notionClientService.getClient();
	}

	async getDatabase(
		database_id: string,
		options?: GetDbOptionsDto,
	): Promise<NotionRowsDto[]> {
		try {
			const response = await this.notion.databases.query({
				database_id,
				...(options?.filter && { filter: options.filter }),
				...(options?.sorts && { sorts: options.sorts }),
			});

			return response.results.filter(isFullPage).map((page) => {
				const properties =
					page.properties as unknown as NotionPageProperties;

				return {
					page_id: page.id,
					...(properties.Order?.number && {
						order: properties.Order.number,
					}),
					...(properties.Name?.title?.length > 0 && {
						name: properties.Name.title
							.map((text) => text.plain_text)
							.join(''),
					}),
					...(properties.Model?.select?.name && {
						model: properties.Model.select.name,
					}),
					...(properties.Prompt?.rich_text?.length > 0 && {
						prompt: properties.Prompt.rich_text
							.map((text) => text.plain_text)
							.join(''),
					}),
					...(properties.Insert?.select?.name && {
						insert: properties.Insert.select.name,
					}),
					...(properties.Category?.select?.name && {
						category: properties.Category.select.name,
					}),
					...(properties['Sub Category']?.select?.name && {
						sub_category: properties['Sub Category'].select.name,
					}),
					...(properties.Premium?.checkbox !== undefined && {
						premium: properties.Premium.checkbox,
					}),
					...(properties.Done?.checkbox !== undefined && {
						done: properties.Done.checkbox,
					}),

					...(properties.Attribution?.select?.name && {
						attribution: properties.Attribution.select.name,
					}),
					...(properties['Plan Type']?.select?.name && {
						plan_type: properties['Plan Type'].select.name,
					}),
				} as NotionRowsDto;
			});
		} catch (error) {
			console.error('Failed to query Notion database:', error);
			throw new Error(
				`Failed to query Notion database: ${error.message}`,
			);
		}
	}

	async updateDatabase(
		page_id: string,
		dataDto: Partial<UpdateData>,
	): Promise<CreatePageResponse> {
		try {
			const properties: UpdatePageParameters['properties'] = {};

			for (const [key, value] of Object.entries(dataDto)) {
				if (value !== undefined) {
					const notionKey = this.formatNotionKey(key);
					properties[notionKey] = this.getNotionValue(key, value);
				}
			}

			return await this.notion.pages.update({
				page_id,
				properties,
			});
		} catch (error) {
			console.error('Failed to update Notion record:', error);
			throw new BadRequestException(
				`Failed to update Notion record: ${error.message}`,
			);
		}
	}

	async createMainRecord(
		dataDto: NotionTaskCreateDto,
	): Promise<CreatePageResponse> {
		try {
			const properties: Record<string, any> = {
				Name: {
					title: [
						{
							text: {
								content: dataDto.name,
							},
						},
					],
				},
				Spend: {
					number: dataDto.spend,
				},
				Date: {
					date: {
						start: dayjs().toISOString(),
					},
				},
				Email: {
					email: dataDto.email,
				},
				Task: {
					rich_text: [
						{
							text: {
								content: dataDto.task,
							},
						},
					],
				},
				Files: {
					files: [],
				},
				Time: {
					number: dataDto.time,
				},
				Generate: {
					checkbox: false,
				},
				Pdf: {
					checkbox: false,
				},
				Csv: {
					checkbox: false,
				},
				Upload: {
					checkbox: false,
				},
				Mail: {
					checkbox: false,
				},
				Done: {
					checkbox: false,
				},
			};

			return await this.notion.pages.create({
				parent: {
					database_id: process.env.NOTION_CUSTOM_HISTORY_ID,
				},
				properties,
			});
		} catch (error) {
			console.error('Failed to create Notion record:', error);
			throw new BadRequestException(
				`Failed to create Notion record: ${error.message}`,
			);
		}
	}

	private formatNotionKey(key: string): string {
		if (key === 'sub_category') return 'Sub Category';
		if (key === 'status') return 'Status';
		return key.charAt(0).toUpperCase() + key.slice(1);
	}

	private getNotionValue(key: string, value: any): any {
		switch (key) {
			case 'name':
			case 'prompt':
				return {
					[key === 'name' ? 'title' : 'rich_text']: [
						{ text: { content: String(value) } },
					],
				};

			case 'order':
			case 'time':
				return {
					number: Number(value),
				};

			case 'category':
			case 'sub_category':
			case 'attribution':
			case 'model':
			case 'plan_type':
			case 'insert':
				return {
					select: { name: String(value) },
				};

			case 'subcategory':
				return {
					multi_select: [{ name: String(value) }],
				};

			case 'status':
				return {
					status: { name: String(value) },
				};

			case 'generate':
			case 'pdf':
			case 'csv':
			case 'upload':
			case 'mail':
			case 'premium':
			case 'new':
			case 'done':
				return {
					checkbox: Boolean(value),
				};

			case 'files':
				return {
					files: Array.isArray(value)
						? value.map((url) => ({
								name: url.split('/').pop() || url,
								type: 'external' as const,
								external: { url },
							}))
						: [
								{
									name:
										String(value).split('/').pop() ||
										String(value),
									type: 'external' as const,
									external: { url: String(value) },
								},
							],
				};

			default:
				throw new Error(`Unsupported property type: ${key}`);
		}
	}
}
