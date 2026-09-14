import { ForbiddenException, Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Notification } from '../entities/notifications.entity';
import { CreateNotificationDto } from '../dto';

@Injectable()
export class NotificationsService implements OnModuleDestroy {
	private readonly stream$: Subject<Notification> = new Subject<Notification>();

	constructor(
		@InjectRepository(Notification)
		private readonly notificationsRepository: Repository<Notification>,
	) {}

	async list(userId: string): Promise<Notification[]> {
		return this.notificationsRepository
			.createQueryBuilder('notification')
			.where('notification.user_id = :userId', { userId })
			.orWhere('notification.user_id IS NULL AND notification.segment_id IS NULL')
			.orWhere(
				'notification.segment_id IN (SELECT user_segment.segment_id FROM users_segments user_segment WHERE user_segment.user_id = :userId)',
				{ userId },
			)
			.orderBy('notification.created_at', 'DESC')
			.getMany();
	}

	async markAsRead(notificationId: string, userId: string): Promise<Notification> {
		const notification: Notification | null = await this.notificationsRepository.findOne({
			where: { id: notificationId },
		});

		if (!notification) {
			throw new NotFoundException('Notification not found');
		}

		if (notification.userId !== null && notification.userId !== userId) {
			throw new ForbiddenException('Notification does not belong to this user');
		}

		notification.isRead = true;
		notification.readAt = new Date();

		return this.notificationsRepository.save(notification);
	}

	async create(dto: CreateNotificationDto): Promise<Notification> {
		const notification: Notification = this.notificationsRepository.create({
			title: dto.title,
			description: dto.description ?? null,
			image: dto.image ?? null,
			author: dto.author ?? null,
			userId: dto.userId ?? null,
			segmentId: dto.segmentId ?? null,
		});

		const saved: Notification = await this.notificationsRepository.save(notification);

		this.stream$.next(saved);

		return saved;
	}

	stream(userId: string): Observable<MessageEvent> {
		return this.stream$.asObservable().pipe(
			filter((notification: Notification): boolean => this.isVisibleTo(notification, userId)),
			map((notification: Notification): MessageEvent => ({ data: JSON.stringify(notification) }) as MessageEvent),
		);
	}

	private isVisibleTo(notification: Notification, userId: string): boolean {
		if (notification.userId === userId) {
			return true;
		}

		return notification.userId === null && notification.segmentId === null;
	}

	onModuleDestroy(): void {
		this.stream$.complete();
	}
}
