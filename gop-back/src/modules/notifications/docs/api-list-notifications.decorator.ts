import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiListNotifications() {
	return applyDecorators(
		ApiBearerAuth('access_token'),
		ApiOperation({
			summary: 'List notifications for the authenticated user',
			description: 'Returns the user’s personal notifications plus global and segment-targeted broadcasts, newest first.',
		}),
		ApiResponse({
			status: 200,
			description: 'Array of notifications',
			schema: {
				example: [
					{
						id: '8f2b1c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
						userId: null,
						segmentId: null,
						title: 'Your custom prompt is ready',
						description: 'Open your library to view it.',
						image: null,
						author: 'God of Prompt',
						isRead: false,
						readAt: null,
						createdAt: '2026-06-24T12:00:00.000Z',
					},
				],
			},
		}),
		ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' }),
	);
}
