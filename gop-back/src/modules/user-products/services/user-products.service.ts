import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';

import { UsersService } from '../../users/services/users.service';
import { StripeSubscriptionStatus } from '../types';
import { ProductAccessEnum, ProductStatusEnum, UserProducts } from '../entities/user-products.entity';
import { ProductPrices } from '../entities/product-prices.entity';

@Injectable()
export class UserProductsService {
	constructor(
		@InjectRepository(UserProducts)
		private readonly userProductsRepo: Repository<UserProducts>,
		@InjectRepository(ProductPrices)
		private readonly productPricesRepo: Repository<ProductPrices>,
		private readonly usersService: UsersService,
	) {}

	async findBySubscriptionId(subscriptionId: string): Promise<UserProducts | null> {
		try {
			return await this.userProductsRepo.findOne({
				where: { stripeSubscriptionId: subscriptionId },
			});
		} catch (e) {
			throw new InternalServerErrorException(e.message);
		}
	}

	async findByPaymentIntentId(paymentIntentId: string): Promise<UserProducts | null> {
		try {
			return await this.userProductsRepo.findOne({
				where: { stripeOneTimePurchaseId: paymentIntentId },
			});
		} catch (e) {
			throw new InternalServerErrorException(e.message);
		}
	}

	async findByRecordId(id: string): Promise<UserProducts> {
		try {
			const entity = await this.userProductsRepo.findOne({
				where: { id },
			});

			if (!entity) {
				throw new NotFoundException('UserProduct not found');
			}

			return entity;
		} catch (e) {
			throw new HttpException(e.message, e.status || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async findAllByUser(userId: string): Promise<UserProducts[]> {
		try {
			return await this.userProductsRepo.find({
				where: { user: { id: userId } },
				relations: {
					price: true,
					product: true,
				},
			});
		} catch (e) {
			throw new InternalServerErrorException(e.message);
		}
	}

	async findByUserAndProductPrice(userId: string, productId: string, priceId: string): Promise<UserProducts[]> {
		try {
			return await this.userProductsRepo.find({
				where: {
					user: { id: userId },
					product: { id: productId },
					price: { id: priceId },
				},
				relations: {
					user: true,
					product: true,
					price: true,
				},
			});
		} catch (e) {
			throw new InternalServerErrorException(e.message);
		}
	}

	async findPriceByStripeId(stripePriceId: string): Promise<ProductPrices | null> {
		try {
			return await this.productPricesRepo.findOne({
				where: { stripePriceId },
				relations: {
					product: true,
				},
			});
		} catch (e) {
			throw new InternalServerErrorException(e.message);
		}
	}

	async findPricesByNames(names: string[]): Promise<ProductPrices[]> {
		try {
			return await this.productPricesRepo
				.createQueryBuilder('price')
				.leftJoinAndSelect('price.product', 'product')
				.where('price.productPriceName IN (:...names)', { names })
				.getMany();
		} catch (e) {
			throw new InternalServerErrorException(e.message);
		}
	}

	async resolveUserId(userId?: string, email?: string): Promise<string> {
		try {
			if (userId) return userId;

			if (!email) {
				throw new HttpException('Neither user_id nor email provided', HttpStatus.BAD_REQUEST);
			}

			const user = await this.usersService.findOrCreateByEmail(email);

			if (!user?.id) {
				throw new InternalServerErrorException('User creation failed');
			}

			return user.id;
		} catch (e) {
			throw new HttpException(e.message, e.status || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async create(createData: DeepPartial<UserProducts>): Promise<UserProducts> {
		try {
			const entity = this.userProductsRepo.create(createData);
			return await this.userProductsRepo.save(entity);
		} catch (e) {
			throw new InternalServerErrorException(e.message);
		}
	}

	async update(id: string, updateData: DeepPartial<UserProducts>): Promise<UserProducts> {
		try {
			const entity = await this.userProductsRepo.preload({
				id,
				...updateData,
			});

			if (!entity) {
				throw new InternalServerErrorException('Entity not found');
			}

			return await this.userProductsRepo.save(entity);
		} catch (e) {
			throw new InternalServerErrorException(e.message);
		}
	}

	async delete(id: string): Promise<void> {
		try {
			await this.userProductsRepo.delete(id);
		} catch (e) {
			throw new InternalServerErrorException(e.message);
		}
	}

	async getUserEmail(userId: string): Promise<string | null> {
		const user = await this.usersService.findById(userId);
		return user?.email ?? null;
	}

	async getStripeCustomerId(userId: string): Promise<string | null> {
		const user = await this.usersService.findById(userId);
		return user?.stripeCustomerId ?? null;
	}

	async updateUserStripeId(userId: string, customerId: string): Promise<void> {
		await this.usersService.update(userId, {
			stripeCustomerId: customerId,
		});
	}

	mapStatus(stripeStatus: string): ProductStatusEnum {
		const map: Partial<Record<StripeSubscriptionStatus, ProductStatusEnum>> = {
			active: ProductStatusEnum.ACTIVE,
			past_due: ProductStatusEnum.ACTIVE,
			trialing: ProductStatusEnum.ACTIVE,
			cancelled: ProductStatusEnum.INACTIVE,
			deleted: ProductStatusEnum.INACTIVE,
			terminated: ProductStatusEnum.INACTIVE,
		};

		return map[stripeStatus as StripeSubscriptionStatus] ?? ProductStatusEnum.INACTIVE;
	}

	mapAccessType(stripeStatus: string): ProductAccessEnum {
		return stripeStatus === 'trialing' ? ProductAccessEnum.TRIAL : ProductAccessEnum.FULL;
	}

	toIso(unixTimestamp?: number): Date | undefined {
		if (!unixTimestamp) return undefined;
		return new Date(unixTimestamp * 1000);
	}
}
