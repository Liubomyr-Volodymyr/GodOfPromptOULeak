import { HttpException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { INJECTION_TOKENS } from '../../../common/constants';
import { Products, ProductStatus } from '../../user-products/entities/products.entity';
import { ProductPrices } from '../../user-products/entities/product-prices.entity';
import { CreateProductDto, CreateProductPriceDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ListProductsDto } from '../dto/list-products.dto';
import { ProductDetailsDto } from '../dto/product-details.dto';
import { ProductsListDto } from '../dto/products-list.dto';

@Injectable()
export class ProductsService {
	private readonly logger = new Logger(ProductsService.name);

	constructor(
		@InjectRepository(Products)
		private readonly productsRepo: Repository<Products>,
		@InjectRepository(ProductPrices)
		private readonly productPricesRepo: Repository<ProductPrices>,
		private readonly dataSource: DataSource,
		@Inject(INJECTION_TOKENS.STRIPE_CLIENT)
		private readonly stripe: Stripe,
	) {}

	private async retrieveStripePrice(stripePriceId: string): Promise<Stripe.Price> {
		try {
			return await this.stripe.prices.retrieve(stripePriceId);
		} catch (error) {
			// only a missing resource is the operator's fault; auth/network failures must not read as "wrong id"
			if (error instanceof Stripe.errors.StripeInvalidRequestError && error.code === 'resource_missing') {
				throw new HttpException(`stripePriceId "${stripePriceId}" does not exist in Stripe`, HttpStatus.BAD_REQUEST);
			}

			throw new HttpException(
				`Cannot verify stripePriceId "${stripePriceId}" against Stripe: ${error.message}`,
				HttpStatus.BAD_GATEWAY,
			);
		}
	}

	private async assertStripePricesExist(prices: CreateProductPriceDto[]): Promise<void> {
		for (const priceDto of prices) {
			const stripePrice: Stripe.Price = await this.retrieveStripePrice(priceDto.stripePriceId);

			if (!stripePrice.active) {
				this.logger.warn(`Stripe price ${priceDto.stripePriceId} is archived in Stripe`);
			}

			const stripeAmount: number | null =
				stripePrice.unit_amount === null ? null : Number((stripePrice.unit_amount / 100).toFixed(2));

			if (stripeAmount !== null && stripeAmount !== Number(priceDto.price)) {
				this.logger.warn(`Price mismatch for ${priceDto.stripePriceId}: catalog ${priceDto.price}, Stripe ${stripeAmount}`);
			}

			if (stripePrice.currency.toUpperCase() !== priceDto.currency.toUpperCase()) {
				this.logger.warn(
					`Currency mismatch for ${priceDto.stripePriceId}: catalog ${priceDto.currency}, Stripe ${stripePrice.currency}`,
				);
			}
		}
	}

	async list(dto: ListProductsDto): Promise<ProductsListDto> {
		try {
			const queryBuilder = this.productsRepo.createQueryBuilder('product');

			if (dto.type) {
				queryBuilder.andWhere('product.type = :type', { type: dto.type });
			}

			if (dto.status) {
				queryBuilder.andWhere('product.status = :status', { status: dto.status });
			}

			if (dto.slug) {
				queryBuilder.andWhere('product.slug = :slug', { slug: dto.slug });
			}

			if (dto.search) {
				queryBuilder.andWhere('(product.name ILIKE :search OR product.description ILIKE :search)', {
					search: `%${dto.search}%`,
				});
			}

			queryBuilder.orderBy(`product.${dto.sortBy ?? 'createdAt'}`, (dto.order?.toUpperCase() as 'ASC' | 'DESC') ?? 'DESC');

			queryBuilder.take(dto.limit ?? 20);
			queryBuilder.skip(dto.offset ?? 0);

			const [items, total] = await queryBuilder.getManyAndCount();

			return {
				items,
				meta: {
					total,
					limit: dto.limit ?? 20,
					offset: dto.offset ?? 0,
				},
			};
		} catch (error) {
			throw new HttpException(error.message || 'Failed to fetch products', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async findOne(id: string): Promise<ProductDetailsDto> {
		const product: Products | null = await this.productsRepo
			.createQueryBuilder('product')
			.addSelect('product.body')
			.where('product.id = :id', { id })
			.getOne();

		if (!product) {
			throw new NotFoundException(`Product ${id} not found`);
		}

		const prices: ProductPrices[] = await this.productPricesRepo.find({ where: { product: { id } } });

		return { product, prices };
	}

	async findBySlug(slug: string): Promise<ProductDetailsDto> {
		const product: Products | null = await this.productsRepo
			.createQueryBuilder('product')
			.addSelect('product.body')
			.where('product.slug = :slug', { slug })
			.getOne();

		if (!product) {
			throw new NotFoundException(`Product with slug "${slug}" not found`);
		}

		const prices: ProductPrices[] = await this.productPricesRepo.find({ where: { product: { id: product.id } } });

		return { product, prices };
	}

	async create(dto: CreateProductDto): Promise<ProductDetailsDto> {
		const existingBySlug: Products | null = await this.productsRepo.findOne({ where: { slug: dto.slug } });

		if (existingBySlug) {
			throw new HttpException(`Product with slug "${dto.slug}" already exists`, HttpStatus.CONFLICT);
		}

		await this.assertStripePricesExist(dto.prices ?? []);

		try {
			return await this.dataSource.transaction(async (manager: EntityManager): Promise<ProductDetailsDto> => {
				const product: Products = manager.create(Products, {
					name: dto.name,
					type: dto.type,
					slug: dto.slug,
					status: dto.status ?? ProductStatus.DRAFT,
					description: dto.description ?? null,
					body: dto.body ?? null,
					categories: dto.categories ?? null,
					stripeProductId: dto.stripeProductId ?? null,
					beehiivProductDeliveryAutomationId: dto.beehiivProductDeliveryAutomationId ?? null,
					notionProductAccessUrl: dto.notionProductAccessUrl ?? null,
					iconUrl: dto.iconUrl ?? null,
					productTabImageUrl: dto.productTabImageUrl ?? null,
					opengraphImageUrl: dto.opengraphImageUrl ?? null,
					instagramTabImageUrl: dto.instagramTabImageUrl ?? null,
					twitterTabImageUrl: dto.twitterTabImageUrl ?? null,
					fullPrice: dto.fullPrice ?? null,
					lifetimePrice: dto.lifetimePrice ?? null,
					monthlyPrice: dto.monthlyPrice ?? null,
					annualPrice: dto.annualPrice ?? null,
					checkoutUrl: dto.checkoutUrl ?? null,
					subscriptionUrl: dto.subscriptionUrl ?? null,
					landingPageUrl: dto.landingPageUrl ?? null,
					successUrl: dto.successUrl ?? null,
					subscriptionSuccessUrl: dto.subscriptionSuccessUrl ?? null,
					successCmsUrl: dto.successCmsUrl ?? null,
					promptLibraryUrl: dto.promptLibraryUrl ?? null,
					instagramGiveawayUrl: dto.instagramGiveawayUrl ?? null,
					notionLink: dto.notionLink ?? null,
					externalProductId: dto.externalProductId ?? null,
					llm: dto.llm ?? null,
					subscriptionSlug: dto.subscriptionSlug ?? null,
					utm: dto.utm ?? null,
					features: dto.features ?? null,
				});

				const savedProduct: Products = await manager.save(Products, product);

				const prices: ProductPrices[] = (dto.prices ?? []).map(
					(priceDto: CreateProductPriceDto): ProductPrices =>
						manager.create(ProductPrices, {
							product: savedProduct,
							price: priceDto.price,
							currency: priceDto.currency,
							priceType: priceDto.priceType,
							pricePeriod: priceDto.pricePeriod ?? null,
							stripePriceId: priceDto.stripePriceId,
							productPriceName: priceDto.productPriceName,
						}),
				);

				const savedPrices: ProductPrices[] = prices.length ? await manager.save(ProductPrices, prices) : [];

				return { product: savedProduct, prices: savedPrices };
			});
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw new HttpException(error.message || 'Failed to create product', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async update(id: string, dto: UpdateProductDto): Promise<ProductDetailsDto> {
		const product: Products | null = await this.productsRepo.findOne({ where: { id } });

		if (!product) {
			throw new NotFoundException(`Product ${id} not found`);
		}

		if (dto.slug !== undefined && dto.slug !== product.slug) {
			const existingBySlug: Products | null = await this.productsRepo.findOne({ where: { slug: dto.slug } });
			if (existingBySlug && existingBySlug.id !== id) {
				throw new HttpException(`Product with slug "${dto.slug}" already exists`, HttpStatus.CONFLICT);
			}
		}

		Object.assign(product, dto);

		try {
			const savedProduct: Products = await this.productsRepo.save(product);
			const prices: ProductPrices[] = await this.productPricesRepo.find({ where: { product: { id } } });

			return { product: savedProduct, prices };
		} catch (error) {
			throw new HttpException(error.message || 'Failed to update product', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async softDelete(id: string): Promise<Products> {
		const product: Products | null = await this.productsRepo.findOne({ where: { id } });

		if (!product) {
			throw new NotFoundException(`Product ${id} not found`);
		}

		product.status = ProductStatus.ARCHIVED;

		try {
			return await this.productsRepo.save(product);
		} catch (error) {
			throw new HttpException(error.message || 'Failed to archive product', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
