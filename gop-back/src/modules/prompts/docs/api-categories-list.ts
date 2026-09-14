import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiOkResponse } from '@nestjs/swagger';

import { CategoriesListResponseDto } from './prompt-response.dto';

export function ApiCategoriesList() {
	return applyDecorators(
		ApiOperation({
			summary: 'Get categories list',
		}),

		ApiQuery({
			name: 'fields',
			required: false,
			type: String,
			example: 'id,name,slug,parent,description',
			description: 'Comma-separated list of fields',
		}),

		ApiQuery({
			name: 'limit',
			required: false,
			type: Number,
			example: -1,
			description: 'Pagination limit (-1 for all)',
		}),

		ApiQuery({
			name: 'offset',
			required: false,
			type: Number,
			example: 0,
		}),

		ApiOkResponse({
			type: CategoriesListResponseDto,
		}),
	);
}
