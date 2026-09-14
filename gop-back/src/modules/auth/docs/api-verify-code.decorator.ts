import { applyDecorators } from '@nestjs/common';
import {
	ApiOperation,
	ApiResponse,
	ApiUnauthorizedResponse,
	ApiBadRequestResponse,
	ApiBody,
} from '@nestjs/swagger';

export function ApiVerifyCode() {
	return applyDecorators(
		ApiOperation({ summary: 'Verify email with code' }),
		ApiBody({
			description: 'Enter verification code received via email',
			schema: {
				example: {
					email: 'john.doe@example.com',
					code: '123456',
				},
			},
		}),
		ApiResponse({
			status: 200,
			description: 'Email successfully verified, tokens issued',
			schema: {
				example: {
					access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
					refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
				},
			},
		}),
		ApiBadRequestResponse({
			description:
				'Missing or invalid input (e.g. invalid email or code format)',
		}),
		ApiUnauthorizedResponse({
			description: 'Invalid or expired verification code',
		}),
	);
}
