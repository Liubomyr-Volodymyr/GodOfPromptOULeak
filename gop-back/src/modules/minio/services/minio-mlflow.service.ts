import { Injectable } from '@nestjs/common';
import { Client } from 'minio';
import { MinioClientService } from './minio-client.service';

@Injectable()
export class MinioMlflowService {
	private minioClient: Client;

	constructor(private readonly minioClientService: MinioClientService) {
		this.minioClient = this.minioClientService.getClient();
	}

	async upload(fileName: string, buffer: Buffer): Promise<string> {
		try {
			const size = buffer.length;

			await this.minioClient.putObject(process.env.MLFLOW_BUCKET_NAME, fileName, buffer, size, { 'Content-Type': 'text/plain' });

			return `${process.env.MINIO_PUBLIC_URL}/${process.env.MLFLOW_BUCKET_NAME}/${fileName}`;
		} catch (error) {
			console.error('Failed to upload buffer to MinIO', error);
			throw error;
		}
	}
}
