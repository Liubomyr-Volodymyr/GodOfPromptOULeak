import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

export function ApiBookmarkPrompt() {
	return applyDecorators(
		ApiOperation({
			summary: 'Toggle bookmark on prompt',
			description: 'Adds or removes bookmark from prompt depending on current state',
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
