import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '../../../common/decorators';

export function ApiGetMe() {
	return applyDecorators(
		ApiBearerAuth('access_token'),
		ApiOperation({ summary: 'Get current user profile' }),
		ApiResponse({
			status: 200,
			description: 'Returns the current authenticated user profile',
			schema: {
				example: {
					first_name: 'John',
					last_name: 'Doe',
					email: 'john.doe@example.com',
				},
			},
		}),
		ApiUnauthorizedResponse(),
	);
}
