import { applyDecorators } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

import { PromptDetailResponseDto } from './prompt-response.dto';

export function ApiPromptInfo() {
	return applyDecorators(
		ApiOperation({
			summary: 'Get prompt info by id',
		}),
		ApiOkResponse({
			description: 'Prompt detail',
			type: PromptDetailResponseDto,
		}),
		ApiNotFoundResponse({
			description: 'Prompt not found',
		}),
	);
}
