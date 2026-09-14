import { Type } from 'class-transformer';
import {
	IsArray,
	IsEnum,
	IsNumber,
	IsObject,
	IsOptional,
	IsPositive,
	IsString,
	IsUrl,
	Length,
	MaxLength,
	MinLength,
	ValidateNested,
} from 'class-validator';
import { ProductStatus, ProductType } from '../../user-products/entities/products.entity';
import { PriceType } from '../../user-products/entities/product-prices.entity';

export class CreateProductPriceDto {
	@IsNumber({}, { message: 'price must be a number' })
	@IsPositive({ message: 'price must be greater than 0' })
	price: number;

	@IsString({ message: 'currency must be a string' })
	@Length(3, 3, { message: 'currency must be a 3-letter ISO code' })
	currency: string;

	@IsEnum(PriceType, { message: 'priceType must be one_time or recurring' })
	priceType: PriceType;

	@IsOptional()
	@IsString({ message: 'pricePeriod must be a string' })
	@MaxLength(255, { message: 'pricePeriod must be at most 255 characters' })
	pricePeriod?: string;

	@IsString({ message: 'stripePriceId must be a string' })
	@MinLength(1, { message: 'stripePriceId is required' })
	stripePriceId: string;

	@IsString({ message: 'productPriceName must be a string' })
	@MinLength(1, { message: 'productPriceName is required' })
	productPriceName: string;
}

export class CreateProductDto {
	@IsString({ message: 'name must be a string' })
	@MinLength(1, { message: 'name is required' })
	@MaxLength(255, { message: 'name must be at most 255 characters' })
	name: string;

	@IsEnum(ProductType, { message: 'type must be plan, addon, lead-magnet or guide' })
	type: ProductType;

	@IsString({ message: 'slug must be a string' })
	@MinLength(1, { message: 'slug is required' })
	@MaxLength(255, { message: 'slug must be at most 255 characters' })
	slug: string;

	@IsOptional()
	@IsEnum(ProductStatus, { message: 'status must be draft, published or archived' })
	status?: ProductStatus;

	@IsOptional()
	@IsString({ message: 'description must be a string' })
	description?: string;

	@IsOptional()
	@IsString({ message: 'body must be a string' })
	body?: string;

	@IsOptional()
	@IsObject({ message: 'categories must be an object' })
	categories?: Record<string, unknown>;

	@IsOptional()
	@IsString({ message: 'stripeProductId must be a string' })
	stripeProductId?: string;

	@IsOptional()
	@IsString({ message: 'beehiivProductDeliveryAutomationId must be a string' })
	beehiivProductDeliveryAutomationId?: string;

	@IsOptional()
	@IsUrl({}, { message: 'notionProductAccessUrl must be a valid URL' })
	notionProductAccessUrl?: string;

	@IsOptional()
	@IsString({ message: 'iconUrl must be a string' })
	iconUrl?: string;

	@IsOptional()
	@IsString({ message: 'productTabImageUrl must be a string' })
	productTabImageUrl?: string;

	@IsOptional()
	@IsString({ message: 'opengraphImageUrl must be a string' })
	opengraphImageUrl?: string;

	@IsOptional()
	@IsString({ message: 'instagramTabImageUrl must be a string' })
	instagramTabImageUrl?: string;

	@IsOptional()
	@IsString({ message: 'twitterTabImageUrl must be a string' })
	twitterTabImageUrl?: string;

	@IsOptional()
	@IsNumber({}, { message: 'fullPrice must be a number' })
	@IsPositive({ message: 'fullPrice must be greater than 0' })
	fullPrice?: number;

	@IsOptional()
	@IsNumber({}, { message: 'lifetimePrice must be a number' })
	@IsPositive({ message: 'lifetimePrice must be greater than 0' })
	lifetimePrice?: number;

	@IsOptional()
	@IsNumber({}, { message: 'monthlyPrice must be a number' })
	@IsPositive({ message: 'monthlyPrice must be greater than 0' })
	monthlyPrice?: number;

	@IsOptional()
	@IsNumber({}, { message: 'annualPrice must be a number' })
	@IsPositive({ message: 'annualPrice must be greater than 0' })
	annualPrice?: number;

	@IsOptional()
	@IsString({ message: 'checkoutUrl must be a string' })
	checkoutUrl?: string;

	@IsOptional()
	@IsString({ message: 'subscriptionUrl must be a string' })
	subscriptionUrl?: string;

	@IsOptional()
	@IsString({ message: 'landingPageUrl must be a string' })
	landingPageUrl?: string;

	@IsOptional()
	@IsString({ message: 'successUrl must be a string' })
	successUrl?: string;

	@IsOptional()
	@IsString({ message: 'subscriptionSuccessUrl must be a string' })
	subscriptionSuccessUrl?: string;

	@IsOptional()
	@IsString({ message: 'successCmsUrl must be a string' })
	successCmsUrl?: string;

	@IsOptional()
	@IsString({ message: 'promptLibraryUrl must be a string' })
	promptLibraryUrl?: string;

	@IsOptional()
	@IsString({ message: 'instagramGiveawayUrl must be a string' })
	instagramGiveawayUrl?: string;

	@IsOptional()
	@IsString({ message: 'notionLink must be a string' })
	notionLink?: string;

	@IsOptional()
	@IsString({ message: 'externalProductId must be a string' })
	externalProductId?: string;

	@IsOptional()
	@IsString({ message: 'llm must be a string' })
	llm?: string;

	@IsOptional()
	@IsString({ message: 'subscriptionSlug must be a string' })
	subscriptionSlug?: string;

	@IsOptional()
	@IsObject({ message: 'utm must be an object' })
	utm?: Record<string, string>;

	@IsOptional()
	@IsArray({ message: 'features must be an array' })
	@IsString({ each: true, message: 'each feature must be a string' })
	features?: string[];

	@IsOptional()
	@IsArray({ message: 'prices must be an array' })
	@ValidateNested({ each: true })
	@Type(() => CreateProductPriceDto)
	prices?: CreateProductPriceDto[];
}
