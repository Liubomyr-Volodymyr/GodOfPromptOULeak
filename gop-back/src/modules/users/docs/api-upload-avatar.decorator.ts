import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '../../../common/decorators';

export function ApiUploadAvatar() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiOperation({
			summary: 'Upload and update user avatar',
			description: 'Allows an authenticated user to upload an avatar image (JPG, PNG, WEBP). The file is stored in MINIO.',
		}),
		ApiConsumes('multipart/form-data'),
		ApiBody({
			schema: {
				type: 'object',
				properties: {
					file: {
						type: 'string',
						format: 'binary',
						description: 'Avatar image file (.jpg, .png, .webp)',
					},
				},
				required: ['file'],
			},
		}),
		ApiResponse({
			status: 200,
			description: 'Avatar uploaded successfully',
			schema: {
				example: {
					avatarId: '31de1f2e-1b2c-4ef8-83cf-04f8e8d6e689',
				},
			},
		}),
		ApiUnauthorizedResponse(),
		ApiResponse({
			status: 400,
			description: 'Invalid or missing file (only JPG, PNG, WEBP allowed)',
		}),
	);
}
