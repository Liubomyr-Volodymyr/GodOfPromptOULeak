import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

export function ApiSavePrompt() {
	return applyDecorators(
		ApiOperation({
			summary: 'Save prompt to folder',
			description: 'Save prompt to folder',
		}),
		ApiBody({
			schema: {
				type: 'object',
				properties: {
					promptId: { type: 'string' },
				},
				required: ['promptId'],
			},
			examples: {
				default: {
					summary: 'Example payload',
					value: {
						promptId: 'prompt_id',
					},
				},
			},
		}),
	);
}
