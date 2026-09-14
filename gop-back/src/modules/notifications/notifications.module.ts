import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notifications.entity';
import { NotificationsService } from './services/notifications.service';
import { NotificationsController } from './controllers/notifications.controller';
import { SseJwtGuard } from './guards/sse-jwt.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [TypeOrmModule.forFeature([Notification]), AuthModule],
	controllers: [NotificationsController],
	providers: [NotificationsService, SseJwtGuard],
	exports: [NotificationsService],
})
export class NotificationsModule {}
