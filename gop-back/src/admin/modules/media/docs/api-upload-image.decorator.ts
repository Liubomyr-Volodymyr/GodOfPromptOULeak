import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiUploadImage(): MethodDecorator & ClassDecorator {
	return applyDecorators(
		ApiOperation({
			summary: 'Upload image to the media bucket',
			description: 'Stores an image (JPG, PNG, WEBP, GIF, SVG) in MinIO under the given folder and returns its public URL.',
		}),
		ApiConsumes('multipart/form-data'),
		ApiBody({
			schema: {
				type: 'object',
				properties: {
					file: {
						type: 'string',
						format: 'binary',
						description: 'Image file (.jpg, .png, .webp, .gif, .svg), max 5MB',
					},
					folder: {
						type: 'string',
						description: 'Target folder inside the media bucket (lowercase letters, digits, dashes)',
						example: 'products',
					},
				},
				required: ['file', 'folder'],
			},
		}),
		ApiResponse({
			status: 201,
			description: 'Image uploaded',
			schema: {
				example: {
					url: 'https://bucket-production-v2.up.railway.app/admin-media/products/31de1f2e-1b2c-4ef8-83cf-04f8e8d6e689.png',
					key: 'products/31de1f2e-1b2c-4ef8-83cf-04f8e8d6e689.png',
				},
			},
		}),
		ApiResponse({
			status: 400,
			description: 'Invalid or missing file (only JPG, PNG, WEBP, GIF, SVG allowed) or invalid folder',
		}),
	);
}
