import { Injectable, OnModuleInit } from '@nestjs/common';
import { EmbeddingModel, FlagEmbedding } from 'fastembed';
import { QdrantClientService } from './qdrant-client.service';

@Injectable()
export class EmbeddingsService implements OnModuleInit {
	private embeddingModel: FlagEmbedding;
	private model: EmbeddingModel = this.qdrantClientService.getModel();

	constructor(private readonly qdrantClientService: QdrantClientService) {}

	async onModuleInit() {
		this.embeddingModel = await FlagEmbedding.init({
			model: this.model as Exclude<EmbeddingModel, EmbeddingModel.CUSTOM>,
			cacheDir: './cache',
		});
	}

	async generateEmbeddings(text: string): Promise<number[]> {
		try {
			const vectorArray = await this.embeddingModel.queryEmbed(text);
			return Array.from(vectorArray);
		} catch (error) {
			console.error('Error generating embeddings:', error);
			throw new Error(`Failed to generate embeddings: ${error.message}`);
		}
	}
}
