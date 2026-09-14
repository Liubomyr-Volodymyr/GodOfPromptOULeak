import { BadRequestException, Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { MinioClientService } from '../../../../modules/minio/services/minio-client.service';
import { IUploadedImage } from '../interfaces/uploaded-image.interface';

interface IBucketPolicyStatement {
	Effect: string;
	Principal: { AWS: string[] };
	Action: string[];
	Resource: string[];
}

interface IBucketPolicy {
	Version: string;
	Statement: IBucketPolicyStatement[];
}

const MIME_TO_EXTENSION: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
	'image/svg+xml': 'svg',
};

@Injectable()
export class AdminMediaService implements OnModuleInit {
	private readonly logger: Logger = new Logger(AdminMediaService.name);
	private readonly bucket: string = process.env.MINIO_MEDIA_BUCKET || 'admin-media';

	constructor(private readonly minio: MinioClientService) {}

	async onModuleInit(): Promise<void> {
		try {
			const exists: boolean = await this.minio.getClient().bucketExists(this.bucket);

			if (!exists) {
				await this.minio.getClient().makeBucket(this.bucket);
			}

			await this.minio.getClient().setBucketPolicy(this.bucket, JSON.stringify(this.buildPublicReadPolicy()));
		} catch (error) {
			// MinIO is unreachable outside the deployed environment; the app must still boot without media uploads
			this.logger.warn(`Media bucket bootstrap failed: ${(error as Error).message}`);
		}
	}

	async uploadImage(file: Express.Multer.File, folder: string): Promise<IUploadedImage> {
		if (!file) throw new BadRequestException('File is required');

		const extension: string | undefined = MIME_TO_EXTENSION[file.mimetype];

		if (!extension) {
			throw new BadRequestException('Only JPG, PNG, WEBP, GIF, SVG allowed');
		}

		const key = `${folder}/${uuid()}.${extension}`;

		try {
			await this.minio.getClient().putObject(this.bucket, key, file.buffer, file.size, {
				'Content-Type': file.mimetype,
			});
		} catch (error) {
			this.logger.error(`Image upload failed: ${(error as Error).message}`);
			throw new InternalServerErrorException('Image upload failed');
		}

		return { url: this.buildPublicUrl(key), key };
	}

	private buildPublicUrl(key: string): string {
		const publicHost: string = (process.env.MINIO_PUBLIC_URL || '').replace(/^https?:\/\//, '');

		return `https://${publicHost}/${this.bucket}/${key}`;
	}

	private buildPublicReadPolicy(): IBucketPolicy {
		return {
			Version: '2012-10-17',
			Statement: [
				{
					Effect: 'Allow',
					Principal: { AWS: ['*'] },
					Action: ['s3:GetObject'],
					Resource: [`arn:aws:s3:::${this.bucket}/*`],
				},
			],
		};
	}
}
