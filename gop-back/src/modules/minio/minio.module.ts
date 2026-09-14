import { Module } from '@nestjs/common';
import { MinioClientService } from './services/minio-client.service';
import { MinioMlflowService } from './services/minio-mlflow.service';

@Module({
	controllers: [],
	providers: [MinioClientService, MinioMlflowService],
	imports: [],
	exports: [MinioMlflowService, MinioClientService],
})
export class MinioModule {}
