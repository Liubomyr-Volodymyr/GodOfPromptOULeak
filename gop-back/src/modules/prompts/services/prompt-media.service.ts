import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { Client } from 'minio';
import { MinioClientService } from '../../minio/services/minio-client.service';

@Injectable()
export class PromptMediaService {
	private readonly bucketName = 'prompt-screenshots';
	private minioClient: Client;
	constructor(private readonly minioService: MinioClientService) {
		this.minioClient = minioService.getClient();
	}

	async uploadScreenshot(buffer: Buffer, filename?: string): Promise<string> {
		try {
			const ext = path.extname(filename || '') || '.jpg';
			const objectName = `screenshots/${Date.now()}-${randomUUID()}${ext}`;

			await this.minioClient.putObject(this.bucketName, objectName, buffer, buffer.length, {
				'Content-Type': 'image/jpeg',
			});

			return objectName;
		} catch (e) {
			throw new HttpException('Failed to upload file to MinIO', HttpStatus.BAD_GATEWAY);
		}
	}

	getScreenshotUrl(objectName: string): string {
		try {
			return `${process.env.MINIO_PUBLIC_URL}/${this.bucketName}/${objectName}`;
		} catch (e) {
			throw new HttpException('Failed to generate file URL', HttpStatus.BAD_GATEWAY);
		}
	}
}
