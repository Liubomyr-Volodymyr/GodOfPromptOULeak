import { Module } from '@nestjs/common';
import { MLflowService } from './services/mlflow.service';
import { MinioModule } from '../minio/minio.module';

@Module({
	controllers: [],
	providers: [MLflowService],
	imports: [MinioModule],
	exports: [MLflowService],
})
export class MlflowModule {}
