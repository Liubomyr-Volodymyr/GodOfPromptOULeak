import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiNotificationStream() {
	return applyDecorators(
		ApiOperation({
			summary: 'Server-Sent Events stream of notifications',
			description:
				'Opens an SSE connection (text/event-stream) that pushes notifications visible to the user as they are created. ' +
				'EventSource cannot send an Authorization header, so the JWT is passed via the `token` query parameter.',
		}),
		ApiQuery({ name: 'token', description: 'Access token (JWT)', required: true }),
		ApiResponse({
			status: 200,
			description: 'SSE stream; each event data is a JSON-serialized notification',
		}),
		ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid stream token' }),
	);
}
