import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';

@Injectable()
export class MinioClientService implements OnModuleInit {
	private readonly minioClient: Client;
	private readonly bucketPolicy = {
		Version: '2012-10-17',
		Statement: [
			{
				Effect: 'Allow',
				Principal: { AWS: ['*'] },
				Action: ['s3:GetObject'],
				Resource: [`arn:aws:s3:::${process.env.MLFLOW_BUCKET_NAME}/*`],
			},
		],
	};

	constructor() {
		this.minioClient = new Client({
			endPoint: process.env.MINIO_HOST,
			port: parseInt(process.env.MINIO_PORT),
			useSSL: process.env.MINIO_USE_SSL === 'true',
			accessKey: process.env.MINIO_USER,
			secretKey: process.env.MINIO_PASS,
		});
	}

	async onModuleInit() {
		// try {
		// 	const bucketExists = await this.minioClient.bucketExists(
		// 		process.env.MLFLOW_BUCKET_NAME,
		// 	);
		// 	if (!bucketExists) {
		// 		await this.minioClient.makeBucket(
		// 			process.env.MLFLOW_BUCKET_NAME,
		// 		);
		// 		console.log(
		// 			`@ Bucket ${process.env.MLFLOW_BUCKET_NAME} created successfully`,
		// 		);
		// 	}
		//
		// 	await this.minioClient.setBucketPolicy(
		// 		process.env.MLFLOW_BUCKET_NAME,
		// 		JSON.stringify(this.bucketPolicy),
		// 	);
		// 	console.log('+ Successfully connected to MinIO');
		// } catch (error) {
		// 	console.error('Failed to connect to MinIO', error);
		// 	throw error;
		// }
	}

	getClient(): Client {
		return this.minioClient;
	}
}
