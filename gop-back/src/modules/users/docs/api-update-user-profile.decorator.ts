import { applyDecorators } from '@nestjs/common';
import {
	ApiOperation,
	ApiBody,
	ApiResponse,
	ApiBearerAuth,
} from '@nestjs/swagger';
import { UpdateUserDto } from '../dto';
import { ApiUnauthorizedResponse } from '../../../common/decorators';

export function ApiUpdateUserProfile() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiOperation({
			summary: 'Update the authenticated user profile',
		}),
		ApiBody({
			type: UpdateUserDto,
			examples: {
				default: {
					summary: 'Example update payload',
					value: {
						first_name: 'John',
						last_name: 'Doe',
					},
				},
			},
		}),
		ApiResponse({
			status: 200,
			description: 'Successfully updated user profile',
			schema: {
				example: {
					success: true,
				},
			},
		}),
		ApiUnauthorizedResponse(),
		ApiResponse({
			status: 403,
			description: 'Forbidden: Access denied',
		}),
	);
}
