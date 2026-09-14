import { Controller, Get, Param, Patch, Req, Sse, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { NotificationsService } from '../services/notifications.service';
import { Notification } from '../entities/notifications.entity';
import { JwtAuthGuard } from '../../auth/guards';
import { SseJwtGuard } from '../guards/sse-jwt.guard';
import { ApiListNotifications, ApiNotificationStream, ApiUpdateNotification } from '../docs';

@Controller('notifications')
@ApiTags('Notifications')
export class NotificationsController {
	constructor(private readonly notificationsService: NotificationsService) {}

	@Get()
	@UseGuards(JwtAuthGuard)
	@ApiListNotifications()
	list(@Req() request: Request): Promise<Notification[]> {
		return this.notificationsService.list(request.user.userId);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	@ApiUpdateNotification()
	markAsRead(@Param('id') notificationId: string, @Req() request: Request): Promise<Notification> {
		return this.notificationsService.markAsRead(notificationId, request.user.userId);
	}

	@SkipThrottle()
	@Sse('stream')
	@UseGuards(SseJwtGuard)
	@ApiNotificationStream()
	stream(@Req() request: Request): Observable<MessageEvent> {
		return this.notificationsService.stream(request.user.userId);
	}
}
