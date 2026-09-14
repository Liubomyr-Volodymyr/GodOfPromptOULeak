import { Injectable, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { EmbeddingModel } from 'fastembed';

@Injectable()
export class QdrantClientService implements OnModuleInit {
	private readonly client: QdrantClient;
	private readonly model: EmbeddingModel;
	private readonly vectorSize: number;
	private readonly collectionName: string;

	constructor() {
		this.model = EmbeddingModel.BGEBaseENV15; // BGEBaseENV15 || MLE5Large
		this.vectorSize = 768; // 384 || 768 || 1024 || 1536
		this.collectionName = 'prompts_vectors_' + this.model;
		this.client = new QdrantClient({
			url: process.env.QDRANT_URL,
			port: null,
			apiKey: process.env.QDRANT_API_KEY,
		});
	}

	async onModuleInit() {
		try {
			const collections = await this.client.getCollections();
			const exists = collections.collections.some((collection: { name: string }) => collection.name === this.collectionName);

			if (!exists) {
				await this.client.createCollection(this.collectionName, {
					vectors: {
						size: this.vectorSize,
						distance: 'Cosine',
					},
				});

				await this.createIndices();
			}

			console.log(`+ Successfully connected to Qdrant and ensured collection '${this.collectionName}' exists`);
		} catch (error) {
			console.error('- Failed to initialize Qdrant collection:', error);
		}
	}

	async createIndices() {
		try {
			await this.client.createPayloadIndex(this.collectionName, {
				field_name: 'category',
				field_schema: 'integer',
			});

			await this.client.createPayloadIndex(this.collectionName, {
				field_name: 'sub_category',
				field_schema: 'integer',
			});

			console.log('+ Successfully created indices for category and sub_category');
		} catch (error) {
			console.error('- Failed to create indices:', error);
		}
	}

	getClient(): QdrantClient {
		return this.client;
	}

	getCollectionName(): string {
		return this.collectionName;
	}

	getModel(): EmbeddingModel {
		return this.model;
	}

	async deleteCollection(collectionName: string) {
		try {
			await this.client.deleteCollection(collectionName);
			console.log(`Successfully deleted collection '${collectionName}'`);
		} catch (error) {
			console.error(`Failed to delete collection '${collectionName}':`, error);
		}
	}
}
