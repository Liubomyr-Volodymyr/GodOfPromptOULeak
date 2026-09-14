import { applyDecorators } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiForbiddenResponse,
	ApiOkResponse,
	ApiOperation,
	ApiQuery,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { PromptSortField, PromptStatusFilter, SortOrder } from '../dto/prompts-query.dto';
import { PromptCreationTypes } from '../dto/save-prompt.dto';
import { PromptsListResponseDto } from './prompt-response.dto';

export const ApiPromptsLibrary = () => {
	return applyDecorators(
		ApiOperation({
			summary: 'Get prompts library',
			description:
				'Returns paginated prompts (published, internal + custom by default) with categories, subcategories and recommended tools. Filter by prompt_creation_type and status',
		}),

		ApiQuery({
			name: 'limit',
			required: false,
			type: Number,
			example: 24,
			description: 'Number of items per page',
		}),

		ApiQuery({
			name: 'offset',
			required: false,
			type: Number,
			example: 0,
			description: 'Pagination offset',
		}),

		ApiQuery({
			name: 'sort',
			required: false,
			enum: PromptSortField,
			example: PromptSortField.DATE_PUBLISHED,
			description: 'Field used for sorting',
		}),

		ApiQuery({
			name: 'order',
			required: false,
			enum: SortOrder,
			example: SortOrder.DESC,
			description: 'Sorting order',
		}),

		ApiQuery({
			name: 'categorySlug',
			required: false,
			type: String,
			example: 'marketing',
			description: 'Filter by category slug',
		}),

		ApiQuery({
			name: 'subCategorySlug',
			required: false,
			type: String,
			example: 'seo',
			description: 'Filter by subcategory slug',
		}),

		ApiQuery({
			name: 'output_type',
			required: false,
			type: String,
			example: 'image',
			description:
				'Filter by output type — matches output_types.tech_name (text | image | presentation). Composes with the other filters and is reflected in meta.total.',
		}),

		ApiQuery({
			name: 'tools',
			required: false,
			type: String,
			example: 'chatgpt,claude',
			description: 'Comma separated tool tech names',
		}),

		ApiQuery({
			name: 'search',
			required: false,
			type: String,
			example: 'email generator',
			description: 'Search by prompt name or description',
		}),

		ApiQuery({
			name: 'prompt_creation_type',
			required: false,
			enum: PromptCreationTypes,
			example: PromptCreationTypes.INTERNAL,
			description: 'Filter by creation type (lowercase: internal | custom). Omit to return all prompts (internal + custom)',
		}),

		ApiQuery({
			name: 'status',
			required: false,
			enum: PromptStatusFilter,
			description: 'Filter by status. Defaults to published when omitted; use all for every status',
		}),

		ApiOkResponse({
			description: 'Prompts fetched successfully',
			type: PromptsListResponseDto,
		}),

		ApiBadRequestResponse({
			description: 'Invalid query parameters',
		}),

		ApiUnauthorizedResponse({
			description: 'Unauthorized',
		}),

		ApiForbiddenResponse({
			description: 'Forbidden',
		}),
	);
};
