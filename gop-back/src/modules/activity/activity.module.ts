import { Module } from '@nestjs/common';
import { UserActivityService } from './services/user-activity.service';

@Module({
	providers: [UserActivityService],
	exports: [UserActivityService],
})
export class ActivityModule {}
