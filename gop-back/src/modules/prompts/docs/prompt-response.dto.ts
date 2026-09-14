import { ApiProperty } from '@nestjs/swagger';

import { SeoStatusEnum } from '../../library/entities/categories.entity';
import { ProductStatus, ProductType } from '../../user-products/entities/products.entity';

export class ToolResponseDto {
	@ApiProperty({ example: 1 })
	id: number;

	@ApiProperty({ example: 'ChatGPT' })
	name: string;

	@ApiProperty({ type: String, nullable: true, example: null })
	description: string | null;

	@ApiProperty({ type: String, nullable: true, example: 'https://chat.openai.com' })
	url: string | null;

	@ApiProperty({ type: String, nullable: true, example: 'chatgpt' })
	slug: string | null;

	@ApiProperty({ type: String, nullable: true, example: 'tool-1' })
	public_id: string | null;

	@ApiProperty({ type: String, nullable: true, example: 'llm' })
	type: string | null;

	@ApiProperty({ type: Number, nullable: true, example: null })
	parent_id: number | null;

	@ApiProperty({ type: String, nullable: true })
	title: string | null;

	@ApiProperty({ type: String, nullable: true })
	h1: string | null;

	@ApiProperty({ type: String, nullable: true })
	seo_description: string | null;

	@ApiProperty({ type: String, nullable: true })
	behavior: string | null;

	@ApiProperty({ type: String, nullable: true })
	tips: string | null;

	@ApiProperty({ type: String, nullable: true })
	how_to_use: string | null;

	@ApiProperty({ type: String, nullable: true })
	best_for: string | null;

	@ApiProperty({ type: String, nullable: true })
	icon: string | null;

	@ApiProperty({ type: String, nullable: true })
	hero_image_url: string | null;

	@ApiProperty({ type: String, nullable: true })
	screenshot_image_url: string | null;

	@ApiProperty({ type: String, nullable: true })
	pricing_model: string | null;

	@ApiProperty({ type: String, nullable: true })
	pricing_summary: string | null;

	@ApiProperty({ type: String, nullable: true })
	plb_instructions: string | null;

	@ApiProperty({ example: false })
	supports_variables: boolean;

	@ApiProperty({ type: String, format: 'date-time', nullable: true, example: null })
	published_at: string | null;

	@ApiProperty({ type: String, format: 'date-time', nullable: true, example: null })
	last_reviewed_at: string | null;
}

export class FormatResponseDto {
	@ApiProperty({ example: 1 })
	id: number;

	@ApiProperty({ example: 'Text Prompt' })
	name: string;

	@ApiProperty({ example: 'text_prompt' })
	techName: string;
}

export class CategoryResponseDto {
	@ApiProperty({ example: 99 })
	id: number;

	@ApiProperty({ type: String, format: 'date-time', nullable: true, example: null })
	createdAt: string | null;

	@ApiProperty({ type: String, format: 'date-time', nullable: true, example: '2025-07-27T17:19:29.910Z' })
	updatedAt: string | null;

	@ApiProperty({ type: String, nullable: true, example: 'SEO' })
	name: string | null;

	@ApiProperty({ type: String, nullable: true, example: 'seo' })
	slug: string | null;

	@ApiProperty({ type: String, nullable: true })
	description: string | null;

	@ApiProperty({ type: String, nullable: true })
	metaTitle: string | null;

	@ApiProperty({ type: String, nullable: true })
	metaDescription: string | null;

	@ApiProperty({ type: String, nullable: true })
	seoBodyHtml: string | null;

	@ApiProperty({ type: String, nullable: true })
	ogImageUrl: string | null;

	@ApiProperty({ type: String, nullable: true })
	canonicalUrl: string | null;

	@ApiProperty({ enum: SeoStatusEnum, example: SeoStatusEnum.PENDING })
	seoStatus: SeoStatusEnum;

	@ApiProperty({ example: 0 })
	sortOrder: number;
}

export class PromptToolRelationResponseDto {
	@ApiProperty({ example: 41823 })
	id: number;

	@ApiProperty({ type: () => ToolResponseDto })
	tool: ToolResponseDto;
}

class PromptBaseFieldsDto {
	@ApiProperty({ example: 'd49fa7b7-2957-4834-9892-fa7261e6ce0e' })
	id: string;

	@ApiProperty({ type: String, nullable: true, example: null })
	userId: string | null;

	@ApiProperty({ type: String, nullable: true, example: null })
	userFolderId: string | null;

	@ApiProperty({ type: String, format: 'date-time', example: '2026-05-26T16:00:42.172Z' })
	dateCreated: string;

	@ApiProperty({ example: 'published' })
	status: string;

	@ApiProperty({ type: String, nullable: true, example: '', description: 'Blanked on detail endpoint' })
	exampleOutputEmbed: string | null;

	@ApiProperty({ type: String, nullable: true })
	exampleOutputUrl: string | null;

	@ApiProperty({ type: String, nullable: true, example: '🔍' })
	icon: string | null;

	@ApiProperty({ type: String, nullable: true })
	whatThisPromptDoes: string | null;

	@ApiProperty({ type: String, nullable: true })
	tips: string | null;

	@ApiProperty({ type: String, nullable: true })
	description: string | null;

	@ApiProperty({ example: 'code-review-agent-multi-language' })
	slug: string;

	@ApiProperty({ example: 'Code Review Agent for Pull Requests' })
	pageName: string;

	@ApiProperty({ example: 'Code Review Agent — Multi-Language' })
	promptName: string;

	@ApiProperty({ type: String, nullable: true })
	howToUseThePrompt: string | null;

	@ApiProperty({ type: String, nullable: true })
	seoDescription: string | null;

	@ApiProperty({ example: true })
	isPremium: boolean;

	@ApiProperty({ type: String, nullable: true })
	inputBody: string | null;

	@ApiProperty({ type: String, format: 'date-time', nullable: true, example: '2026-05-26T16:00:42.632Z' })
	datePublished: string | null;

	@ApiProperty({ type: Number, nullable: true, example: 2 })
	inputFormatId: number | null;

	@ApiProperty({ type: Number, nullable: true, example: 1 })
	promptFormatId: number | null;

	@ApiProperty({ type: String, nullable: true, example: null })
	moderatorId: string | null;

	@ApiProperty({ example: 0 })
	likesCount: number;

	@ApiProperty({ example: 37 })
	viewsCount: number;

	@ApiProperty({ type: Number, nullable: true, example: 0 })
	uniqueViewsCount: number | null;

	@ApiProperty({ type: Number, nullable: true, example: 0 })
	bookmarksCount: number | null;

	@ApiProperty({ example: 'Role: Senior staff engineer...' })
	promptBody: string;

	@ApiProperty({ type: Number, nullable: true, example: 99 })
	categoryId: number | null;

	@ApiProperty({ type: Number, nullable: true, example: 99 })
	subCategoryId: number | null;

	@ApiProperty({ type: String, nullable: true, example: null })
	generationCost: string | null;

	@ApiProperty({ type: Number, nullable: true, example: null })
	generationInputTokens: number | null;

	@ApiProperty({ type: Number, nullable: true, example: null })
	generationOutputTokens: number | null;

	@ApiProperty({ type: Number, nullable: true, example: 1 })
	authorId: number | null;

	@ApiProperty({ type: Number, nullable: true, example: 1 })
	sourceId: number | null;

	@ApiProperty({ type: String, nullable: true, example: 'text', description: 'output_types.tech_name' })
	output_type: string | null;
}

export class PromptDetailResponseDto extends PromptBaseFieldsDto {
	@ApiProperty({ type: () => [ToolResponseDto] })
	tools: ToolResponseDto[];

	@ApiProperty({ type: () => FormatResponseDto, nullable: true })
	promptFormat: FormatResponseDto | null;

	@ApiProperty({ type: () => FormatResponseDto, nullable: true })
	inputFormat: FormatResponseDto | null;
}

export class PromptListItemResponseDto extends PromptBaseFieldsDto {
	@ApiProperty({ type: () => CategoryResponseDto, nullable: true })
	category: CategoryResponseDto | null;

	@ApiProperty({ type: () => CategoryResponseDto, nullable: true })
	subCategory: CategoryResponseDto | null;

	@ApiProperty({ type: () => [PromptToolRelationResponseDto] })
	toolRelations: PromptToolRelationResponseDto[];

	@ApiProperty({ type: () => FormatResponseDto, nullable: true })
	promptFormat: FormatResponseDto | null;

	@ApiProperty({ type: () => FormatResponseDto, nullable: true })
	inputFormat: FormatResponseDto | null;
}

export class PromptsListMetaDto {
	@ApiProperty({ example: 6832 })
	total: number;

	@ApiProperty({ example: 24 })
	limit: number;

	@ApiProperty({ example: 0 })
	offset: number;
}

export class PromptsListResponseDto {
	@ApiProperty({ type: () => [PromptListItemResponseDto] })
	data: PromptListItemResponseDto[];

	@ApiProperty({ type: () => PromptsListMetaDto })
	meta: PromptsListMetaDto;
}

export class ToolsListResponseDto {
	@ApiProperty({ type: () => [ToolResponseDto] })
	data: ToolResponseDto[];
}

export class CategoriesListResponseDto {
	@ApiProperty({ type: () => [CategoryResponseDto] })
	data: CategoryResponseDto[];
}

export class AudienceTypeResponseDto {
	@ApiProperty({ example: 1 })
	id: number;

	@ApiProperty({ example: 'Developers' })
	name: string;

	@ApiProperty({ example: 'developers' })
	slug: string;
}

export class ProductResponseDto {
	@ApiProperty({ example: 'b1f2…' })
	id: string;

	@ApiProperty({ example: 'Pro Plan' })
	name: string;

	@ApiProperty({ type: String, nullable: true })
	description: string | null;

	@ApiProperty({ enum: ProductType, example: ProductType.PLAN })
	type: ProductType;

	@ApiProperty({ enum: ProductStatus, example: ProductStatus.PUBLISHED })
	status: ProductStatus;

	@ApiProperty({ example: 'pro-plan' })
	slug: string;

	@ApiProperty({ type: 'object', additionalProperties: true, nullable: true, description: 'jsonb' })
	categories: Record<string, unknown> | null;

	@ApiProperty({ type: String, nullable: true })
	stripeProductId: string | null;

	@ApiProperty({ type: String, nullable: true })
	beehiivProductDeliveryAutomationId: string | null;

	@ApiProperty({ type: String, nullable: true })
	notionProductAccessUrl: string | null;

	@ApiProperty({ type: String, format: 'date-time' })
	createdAt: string;

	@ApiProperty({ type: String, format: 'date-time', nullable: true })
	updatedAt: string | null;
}

export class ProductsListResponseDto {
	@ApiProperty({ type: () => [ProductResponseDto] })
	data: ProductResponseDto[];
}
