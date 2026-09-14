import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ResetPasswordDto } from '../../users/dto';

export function ApiResetPassword() {
	return applyDecorators(
		ApiOperation({
			summary: 'Reset password using token (no login required)',
		}),
		ApiBody({
			type: ResetPasswordDto,
			examples: {
				default: {
					summary: 'Example payload',
					value: {
						password: 'NewPassword123',
					},
				},
			},
		}),
		ApiResponse({
			status: 200,
			description: 'Password reset successfully',
			schema: {
				example: {
					message: 'Password reset successfully',
				},
			},
		}),
		ApiResponse({
			status: 400,
			description: 'Bad Request - user not found or invalid token',
		}),
	);
}
