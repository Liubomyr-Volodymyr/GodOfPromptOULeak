import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiUnauthorizedResponse() {
	return applyDecorators(
		ApiResponse({
			status: 401,
			description: 'Unauthorized: Missing or invalid token',
			schema: {
				example: {
					success: false,
					statusCode: 401,
					timestamp: new Date().toISOString(),
					path: '/api/example',
					message: 'Unauthorized',
					errors: ['Unauthorized'],
				},
			},
		}),
	);
}
