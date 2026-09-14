import { applyDecorators } from '@nestjs/common';
import {
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '../../../common/decorators';

export function ApiFindContactByEmail() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiOperation({
			summary: 'Find a user contact by email',
		}),
		ApiParam({
			name: 'email',
			type: String,
			required: true,
			description: 'Primary email of the user',
			example: 'john.doe@example.com',
		}),
		ApiResponse({
			status: 200,
			description: 'User contact found',
			schema: {
				example: {
					id: '5c270a9a-ed54-4698-81ee-5fb6227ee6f4',
					status: 'new',
					first_name: 'John',
					last_name: 'Doe',
					primary_email: '5551eac5-e71e-4a06-91ce-6383fe855289',
					date_created: '2025-07-04T10:26:14.345Z',
					date_updated: '2025-07-14T13:05:16.932Z',
				},
			},
		}),
		ApiUnauthorizedResponse(),
		ApiResponse({
			status: 404,
			description: 'User not found',
		}),
	);
}
