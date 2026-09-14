import { applyDecorators } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
} from '@nestjs/swagger';
import { ResetPasswordDto } from '../../users/dto';

export function ApiUpdatePassword() {
	return applyDecorators(
		ApiBearerAuth('access_token'),
		ApiOperation({ summary: 'Reset user password (authenticated)' }),
		ApiBody({
			type: ResetPasswordDto,
			examples: {
				default: {
					summary: 'Example reset password payload',
					value: {
						old_password: 'OldPassword123',
						new_password: 'NewPassword456',
					},
				},
			},
		}),
		ApiResponse({
			status: 200,
			description: 'Password updated successfully',
			schema: {
				example: {
					message: 'Password updated successfully',
				},
			},
		}),
		ApiResponse({
			status: 401,
			description: 'Unauthorized - token invalid or expired',
		}),
		ApiResponse({
			status: 400,
			description: 'Bad Request - validation or password mismatch',
		}),
	);
}
