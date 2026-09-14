import { applyDecorators } from '@nestjs/common';
import {
	ApiOperation,
	ApiOkResponse,
	ApiNoContentResponse,
	ApiProduces,
} from '@nestjs/swagger';

export function ApiGetAvatar() {
	return applyDecorators(
		ApiOperation({
			summary: 'Get user avatar image',
			description: 'Returns raw avatar image as binary stream',
		}),
		ApiProduces('image/jpeg', 'image/png', 'image/webp'),
		ApiOkResponse({
			description: 'Avatar image stream',
			content: {
				'image/jpeg': {
					schema: {
						type: 'string',
						format: 'binary',
					},
				},
				'image/png': {
					schema: {
						type: 'string',
						format: 'binary',
					},
				},
			},
		}),
		ApiNoContentResponse({
			description: 'Avatar not found',
		}),
	);
}
