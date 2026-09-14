import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { ToolsListResponseDto } from './prompt-response.dto';

export function ApiToolsList() {
	return applyDecorators(
		ApiOperation({
			summary: 'Get tools list',
		}),

		ApiQuery({
			name: 'fields',
			required: false,
			type: String,
			example: 'id,name,slug',
			description: 'Comma-separated list of fields',
		}),

		ApiQuery({
			name: 'limit',
			required: false,
			type: Number,
			example: 50,
			description: 'Pagination limit (-1 for all)',
		}),

		ApiQuery({
			name: 'offset',
			required: false,
			type: Number,
			example: 0,
			description: 'Pagination offset',
		}),

		ApiOkResponse({
			type: ToolsListResponseDto,
		}),
	);
}
