import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginAdminDto } from '../../modules/auth/dto/login-admin.dto';

export function ApiAdminLogin() {
	return applyDecorators(
		ApiOperation({ summary: 'Admin login' }),
		ApiBody({
			type: LoginAdminDto,
			examples: {
				default: {
					summary: 'Example login payload',
					value: {
						email: 'john.doe@admin.com',
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
