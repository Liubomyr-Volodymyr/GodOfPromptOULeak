import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from '../dto';

export function ApiLogin() {
	return applyDecorators(
		ApiOperation({ summary: 'User login' }),
		ApiBody({
			type: LoginDto,
			examples: {
				default: {
					summary: 'Example login payload',
					value: {
						email: 'john.doe@example.com',
						password: 'Password123',
					},
				},
			},
		}),
		ApiResponse({
			status: 200,
			description: 'Login successful, returns JWT token',
			schema: {
				example: {
					access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
					refresh_token: 'rv13JhbGciOweiJsInR5cCI6cIkpXVCJ9...',
				},
			},
		}),
		ApiResponse({
			status: 401,
			description: 'Unauthorized - invalid credentials',
		}),
	);
}
