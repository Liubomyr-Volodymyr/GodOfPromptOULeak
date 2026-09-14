import { BadRequestException, Injectable } from '@nestjs/common';
import { Client } from '@notionhq/client';
import { NotionClientService } from './notion-client.service';
import { AddToLibraryDto } from '../dto/notion-pages.dto';
import { InternalAiResult } from '../../generator/dto/internal-prompts.dto';
import { CreatePageResponse } from '@notionhq/client/build/src/api-endpoints';
import { UpdateLibraryDto } from '../dto/notion-library.dto';
import { NotionService } from './notion.service';

@Injectable()
export class NotionPagesService {
	private readonly notion: Client;
	private readonly syncedBlock1Id = '4387d801335c4f3cb8f613f78cd3b4cc';
	private readonly syncedBlock2Id = '62fbb6e14479485681b1c77bb16543d6';

	constructor(
		private readonly notionClientService: NotionClientService,
		private readonly notionService: NotionService,
	) {
		this.notion = this.notionClientService.getClient();
	}

	async addToLibrary(dataDto: AddToLibraryDto): Promise<CreatePageResponse> {
		try {
			if (!dataDto.parent_id || !dataDto.sub_category) {
				throw new BadRequestException(`Invalid parent_id or sub-category for dataDto: ${JSON.stringify(dataDto)}`);
			}

			const properties = {
				Status: {
					status: {
						name: 'Pending',
					},
				},
				Name: {
					title: [
						{
							text: {
								content: dataDto.ai_result['page-name'],
							},
						},
					],
				},
				Subcategory: {
					multi_select: [
						{
							name: dataDto.sub_category,
						},
					],
				},
				Date: {
					date: {
						start: new Date().toISOString(),
					},
				},
			};

			const pageData: any = {
				parent: {
					database_id: dataDto.parent_id,
				},
				properties,
			};

			pageData.icon = {
				type: 'emoji',
				emoji: dataDto.ai_result.icon,
			};

			pageData.children = this.prepareChildren(dataDto.screenshot, dataDto.ai_result, dataDto.modelNames);

			return await this.notion.pages.create(pageData);
		} catch (error) {
			console.error('Failed to create Notion page with blocks:', error);
			throw new BadRequestException(`Failed to create Notion page with blocks: ${error.message}`);
		}
	}

	async updateLibrary(updateDto: UpdateLibraryDto) {
		return await this.notionService.updateDatabase(updateDto.notion_id, {
			name: updateDto.name,
			subcategory: updateDto.sub_category,
			status: this.capitalizeFirstLetter(updateDto.status),
		});
	}

	async deleteLibraryItem(notionId: string) {
		try {
			const formattedNotionId = this.formatNotionId(notionId);
			return await this.notion.pages.update({
				page_id: formattedNotionId,
				archived: true,
			});
		} catch (error) {
			console.error('Failed to delete Notion page:', error);
			throw new BadRequestException(`Failed to delete Notion page: ${error.message}`);
		}
	}

	private prepareChildren(screenshot: string, data: InternalAiResult, modelNames: string[]) {
		const blocks = [];

		blocks.push(this.addCallout(data.description));
		blocks.push(this.addQuote('Recommended models: ', modelNames.join(', ')));
		blocks.push(this.addDivider());
		blocks.push(this.addSyncedBlock(this.syncedBlock1Id));
		blocks.push(this.addH2Title('⚙️ What This Prompt Does:'));
		blocks.push(this.addParagraph(data['what-prompt-does']));
		blocks.push(this.addH2Title('💡Tips:'));
		blocks.push(this.addParagraph(data.tips));
		blocks.push(this.addH2Title(`${data.icon} ${data['prompt-name']} AI Prompt:`));
		blocks.push(this.addCodeBlock(data['prompt-body']));
		blocks.push(this.addH2Title('❓How To Use The Prompt:'));
		blocks.push(this.addParagraph(data['how-to-use']));
		blocks.push(this.addH2Title('📤 Example Output:'));
		blocks.push(this.addImage(screenshot));
		blocks.push(this.addParagraph(''));
		blocks.push(this.addSyncedBlock(this.syncedBlock2Id));

		return blocks;
	}

	private addDivider() {
		return {
			object: 'block',
			type: 'divider',
			divider: {},
		};
	}
	private addH2Title(title: string) {
		return {
			object: 'block',
			type: 'heading_2',
			heading_2: {
				rich_text: [
					{
						type: 'text',
						text: { content: title },
						annotations: {
							color: 'yellow_background',
						},
					},
				],
			},
		};
	}
	private addParagraph(text: string) {
		return {
			object: 'block',
			type: 'paragraph',
			paragraph: {
				rich_text: [
					{
						type: 'text',
						text: { content: text },
					},
				],
			},
		};
	}
	private addImage(imageUrl: string) {
		return {
			object: 'block',
			type: 'image',
			image: {
				type: 'external',
				external: {
					url: `${imageUrl}.jpg`,
				},
			},
		};
	}
	private addCodeBlock(codeContent: string) {
		const wrappedContent = codeContent.replace(/(.{80})/g, '$1\n');
		const chunks = this.splitTextIntoChunks(wrappedContent, 2000);

		return {
			object: 'block',
			type: 'code',
			code: {
				rich_text: chunks.map((chunk) => ({
					type: 'text',
					text: {
						content: chunk,
					},
				})),
				language: 'plain text',
			},
		};
	}
	private addCallout(content: string, emoji: string = '💡') {
		return {
			object: 'block',
			type: 'callout',
			callout: {
				rich_text: [
					{
						type: 'text',
						text: {
							content: content,
						},
					},
				],
				icon: {
					type: 'emoji',
					emoji: emoji,
				},
				color: 'yellow_background',
			},
		};
	}

	private addQuote(boldText: string, normalText: string) {
		return {
			object: 'block',
			type: 'quote',
			quote: {
				rich_text: [
					{
						type: 'text',
						text: { content: boldText },
						annotations: { bold: true },
					},
					{
						type: 'text',
						text: { content: normalText },
					},
				],
				color: 'default',
			},
		};
	}

	private addSyncedBlock(originalBlockId: string) {
		return {
			object: 'block',
			type: 'synced_block',
			synced_block: {
				synced_from: {
					block_id: originalBlockId,
				},
			},
		};
	}

	private splitTextIntoChunks(text: string, chunkSize: number) {
		const chunks = [];
		for (let i = 0; i < text.length; i += chunkSize) {
			chunks.push(text.slice(i, i + chunkSize));
		}
		return chunks;
	}

	private capitalizeFirstLetter(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	}

	private formatNotionId(id: string): string {
		const cleaned = id.replace(/-/g, '');

		if (cleaned.length !== 32) {
			throw new BadRequestException(`Invalid Notion ID format: expected 32 characters, got ${cleaned.length}. ID: ${id}`);
		}

		if (!/^[a-zA-Z0-9]+$/.test(cleaned)) {
			throw new BadRequestException(`Invalid Notion ID format: contains invalid characters. ID: ${id}`);
		}

		return [cleaned.slice(0, 8), cleaned.slice(8, 12), cleaned.slice(12, 16), cleaned.slice(16, 20), cleaned.slice(20, 32)].join('-');
	}
}
