import { applyDecorators } from '@nestjs/common';
import {
	ApiOperation,
	ApiResponse,
	ApiBadRequestResponse,
	ApiBody,
	ApiTooManyRequestsResponse,
} from '@nestjs/swagger';

export function ApiResendCode() {
	return applyDecorators(
		ApiOperation({ summary: 'Resend email verification code' }),
		ApiBody({
			description: 'Email to resend verification code to',
			schema: {
				example: {
					email: 'john.doe@example.com',
				},
			},
		}),
		ApiResponse({
			status: 200,
			description: 'Verification code resent successfully',
			schema: {
				example: {
					message: 'Verification code resent successfully',
				},
			},
		}),
		ApiTooManyRequestsResponse({
			status: 429,
			description: 'Request > 3 per minute',
		}),
		ApiBadRequestResponse({
			description: 'Invalid email or missing input',
		}),
	);
}
