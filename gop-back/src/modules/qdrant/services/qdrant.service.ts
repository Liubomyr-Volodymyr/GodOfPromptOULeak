import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { AddDataDto } from '../dto/qdrant.dto';
import { QdrantClientService } from './qdrant-client.service';
import { EmbeddingsService } from './embedding.service';
import { PromptsService } from '../../prompts/services/prompts.service';
import { PromptsDto } from '../../prompts/dto/prompts.dto';

@Injectable()
export class QdrantService {
	private readonly client: QdrantClient;
	private readonly collectionName: string;

	constructor(
		private readonly qdrantClientService: QdrantClientService,
		private readonly embeddingsService: EmbeddingsService,
		@Inject(forwardRef(() => PromptsService))
		private readonly promptsService: PromptsService,
	) {
		this.client = this.qdrantClientService.getClient();
		this.collectionName = this.qdrantClientService.getCollectionName();
	}

	async addData(data: AddDataDto): Promise<boolean> {
		try {
			const combinedText = Object.values(data.fields).join(' / ');
			const vector = await this.embeddingsService.generateEmbeddings(combinedText);

			await this.client.upsert(this.collectionName, {
				points: [
					{
						id: data.id,
						vector,
						payload: {
							...data.fields,
							category: data.category,
							sub_category: data.sub_category,
						},
					},
				],
			});

			return true;
		} catch (error) {
			console.error('Failed to add data to Qdrant:', error);
			return false;
		}
	}

	async searchData(searchText: string, category_id?: number, sub_category_id?: number): Promise<PromptsDto[]> {
		try {
			const vector = await this.embeddingsService.generateEmbeddings(searchText);
			const searchParams: any = {
				vector,
				limit: 10,
				params: {
					hnsw_ef: 128,
				},
			};

			if (category_id !== undefined || sub_category_id !== undefined) {
				const filter: any = {
					must: [],
				};

				if (category_id !== undefined) {
					filter.must.push({
						key: 'category',
						match: { value: category_id },
					});
				}

				if (sub_category_id !== undefined) {
					filter.must.push({
						key: 'sub_category',
						match: { value: sub_category_id },
					});
				}

				searchParams.filter = filter;
			}
			let searchResult;
			try {
				searchResult = await this.client.search(this.collectionName, searchParams);
			} catch (socketError: any) {
				if (socketError?.cause?.code === 'UND_ERR_SOCKET') {
					searchResult = await this.client.search(this.collectionName, searchParams);
				} else {
					throw socketError;
				}
			}

			if (searchResult.length === 0) {
				return [];
			}

			const promptsFromDb: PromptsDto[] = await this.promptsService.getPromptsByIds(
				searchResult.map((result: { id: string | number }): string => String(result.id)),
			);

			const promptsMap: Map<string, PromptsDto> = new Map<string, PromptsDto>();
			promptsFromDb.forEach((prompt: PromptsDto): void => {
				promptsMap.set(prompt.id, prompt);
			});

			return searchResult
				.map((result: { id: string | number }): PromptsDto | undefined => promptsMap.get(String(result.id)))
				.filter((item: PromptsDto | undefined): item is PromptsDto => item !== undefined);
		} catch (error) {
			console.error('Failed to search data in Qdrant:', error);
			return [];
		}
	}

	async deleteData(id: number): Promise<boolean> {
		try {
			await this.client.delete(this.collectionName, {
				points: [id],
			});

			return true;
		} catch (error) {
			console.error(`Failed to delete data with ID ${id} from Qdrant:`, error);
			return false;
		}
	}
}
