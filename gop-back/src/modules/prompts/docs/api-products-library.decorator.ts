import { applyDecorators } from '@nestjs/common';

import { ApiOkResponse, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { ProductsListResponseDto } from './prompt-response.dto';

export const ApiProductsLibrary = () => {
	return applyDecorators(
		ApiOperation({
			summary: 'Get public products library',
		}),

		ApiQuery({
			name: 'type',
			required: false,
			example: 'lead-magnet',
		}),

		ApiQuery({
			name: 'sort',
			required: false,
			example: 'name',
		}),

		ApiQuery({
			name: 'limit',
			required: false,
			example: 200,
		}),

		ApiQuery({
			name: 'offset',
			required: false,
			example: 0,
		}),

		ApiOkResponse({
			description: 'Products fetched successfully',
			type: ProductsListResponseDto,
		}),
	);
};
