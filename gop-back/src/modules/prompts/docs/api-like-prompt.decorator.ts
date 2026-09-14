import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

export function ApiLikePrompt() {
	return applyDecorators(
		ApiOperation({
			summary: 'Toggle like on prompt',
			description: 'Adds or removes like from prompt depending on current state',
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
