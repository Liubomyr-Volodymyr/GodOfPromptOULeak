import { Module } from '@nestjs/common';
import { MinioModule } from '../../../modules/minio/minio.module';
import { AdminMediaController } from './media.controller';
import { AdminMediaService } from './services/media.service';

@Module({
	imports: [MinioModule],
	controllers: [AdminMediaController],
	providers: [AdminMediaService],
})
export class AdminMediaModule {}
