import { Module } from '@nestjs/common';
import { GoogleDriveService } from './services/google-drive.service';

@Module({
	controllers: [],
	providers: [GoogleDriveService],
	imports: [],
	exports: [GoogleDriveService],
})
export class GoogleDriveModule {}
