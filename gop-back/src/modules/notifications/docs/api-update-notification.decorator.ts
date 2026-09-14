import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiUpdateNotification() {
	return applyDecorators(
		ApiBearerAuth('access_token'),
		ApiOperation({
			summary: 'Mark a notification as read',
			description: 'Sets is_read=true and read_at on the notification. Only the owner (or any user for a broadcast) may mark it.',
		}),
		ApiParam({ name: 'id', description: 'Notification id', format: 'uuid' }),
		ApiResponse({
			status: 200,
			description: 'Updated notification',
			schema: {
				example: {
					id: '8f2b1c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
					userId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
					segmentId: null,
					title: 'Your custom prompt is ready',
					description: 'Open your library to view it.',
					image: null,
					author: 'God of Prompt',
					isRead: true,
					readAt: '2026-06-24T12:05:00.000Z',
					createdAt: '2026-06-24T12:00:00.000Z',
				},
			},
		}),
		ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' }),
		ApiResponse({ status: 403, description: 'Notification does not belong to this user' }),
		ApiResponse({ status: 404, description: 'Notification not found' }),
	);
}
