import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Orders } from '../../../../modules/orders/entities/orders.entity';
import { FindAllOrdersDto, ORDER_SORT_COLUMN, OrderSortBy } from '../dto/find-all-orders.dto';
import { OrderDto, OrdersPageDto, OrdersTotalsDto } from '../dto/order.dto';
import { SortOrder } from '../../../../common/enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

interface IOrdersTotalsRow {
	orders_count: string | null;
	gross_amount: string | null;
	refunded_amount: string | null;
}

@Injectable()
export class AdminOrdersService {
	constructor(
		@InjectRepository(Orders)
		private readonly ordersRepo: Repository<Orders>,
	) {}

	async findAll(dto: FindAllOrdersDto): Promise<OrdersPageDto> {
		const page: number = Number(dto.page) || 1;
		const limit: number = Number(dto.limit) || 20;
		const sortBy: OrderSortBy = dto.sortBy ?? OrderSortBy.PAID_AT;
		const sortOrder: SortOrder = dto.sortOrder === SortOrder.ASC ? SortOrder.ASC : SortOrder.DESC;

		const whereBuilder: SelectQueryBuilder<Orders> = this.buildFilteredQuery(dto);

		whereBuilder
			.orderBy(ORDER_SORT_COLUMN[sortBy] ?? ORDER_SORT_COLUMN[OrderSortBy.PAID_AT], sortOrder.toUpperCase() as 'ASC' | 'DESC')
			.skip((page - 1) * limit)
			.take(limit);

		const [rows, total]: [Orders[], number] = await whereBuilder.getManyAndCount();

		return this.toPage(rows, total, page, limit);
	}

	async findByMember(userId: string, dto: PaginationQueryDto): Promise<OrdersPageDto> {
		const page: number = Number(dto.page) || 1;
		const limit: number = Number(dto.limit) || 20;
		const sortOrder: SortOrder = dto.sortOrder === SortOrder.ASC ? SortOrder.ASC : SortOrder.DESC;

		const [rows, total]: [Orders[], number] = await this.ordersRepo.findAndCount({
			where: { user: { id: userId } },
			relations: ['user', 'product', 'price'],
			order: { paidAt: sortOrder },
			skip: (page - 1) * limit,
			take: limit,
		});

		return this.toPage(rows, total, page, limit);
	}

	async findOne(orderId: string): Promise<OrderDto> {
		const order: Orders | null = await this.ordersRepo.findOne({
			where: { id: orderId },
			relations: ['user', 'product', 'price'],
		});

		if (!order) throw new NotFoundException('Order not found');

		return this.toOrderView(order);
	}

	async getTotals(dto: FindAllOrdersDto): Promise<OrdersTotalsDto> {
		const whereBuilder: SelectQueryBuilder<Orders> = this.buildFilteredQuery(dto);

		const row: IOrdersTotalsRow | undefined = await whereBuilder
			.select('COUNT(orders.id)', 'orders_count')
			.addSelect('COALESCE(SUM(orders.amount), 0)', 'gross_amount')
			.addSelect('COALESCE(SUM(orders.refunded_amount), 0)', 'refunded_amount')
			.getRawOne<IOrdersTotalsRow>();

		const grossAmount: number = Number(row?.gross_amount ?? 0);
		const refundedAmount: number = Number(row?.refunded_amount ?? 0);

		return {
			orders_count: Number(row?.orders_count ?? 0),
			gross_amount: grossAmount,
			refunded_amount: refundedAmount,
			net_amount: Number((grossAmount - refundedAmount).toFixed(2)),
		};
	}

	private buildFilteredQuery(dto: FindAllOrdersDto): SelectQueryBuilder<Orders> {
		const whereBuilder: SelectQueryBuilder<Orders> = this.ordersRepo
			.createQueryBuilder('orders')
			.leftJoinAndSelect('orders.user', 'user')
			.leftJoinAndSelect('user.emails', 'email')
			.leftJoinAndSelect('orders.product', 'product')
			.leftJoinAndSelect('orders.price', 'price');

		if (dto.search) {
			whereBuilder.andWhere(
				`(user.email ILIKE :search OR email.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)`,
				{ search: `%${dto.search}%` },
			);
		}

		if (dto.user_id) {
			whereBuilder.andWhere(`user.id = :userId`, { userId: dto.user_id });
		}

		if (dto.product_id) {
			whereBuilder.andWhere(`product.id = :productId`, { productId: dto.product_id });
		}

		if (dto.status) {
			whereBuilder.andWhere(`orders.status = :status`, { status: dto.status });
		}

		if (dto.type) {
			whereBuilder.andWhere(`orders.type = :type`, { type: dto.type });
		}

		if (dto.dateFrom) {
			whereBuilder.andWhere(`orders.paidAt >= :dateFrom`, { dateFrom: dto.dateFrom });
		}

		if (dto.dateTo) {
			whereBuilder.andWhere(`orders.paidAt <= :dateTo`, { dateTo: dto.dateTo });
		}

		return whereBuilder;
	}

	private toPage(rows: Orders[], total: number, page: number, limit: number): OrdersPageDto {
		return {
			items: rows.map((order: Orders): OrderDto => this.toOrderView(order)),
			meta: {
				total,
				page,
				limit,
				pageCount: Math.ceil(total / limit),
				hasNextPage: page * limit < total,
			},
		};
	}

	private toOrderView(order: Orders): OrderDto {
		return {
			id: order.id,
			amount: order.amount,
			refunded_amount: order.refundedAmount,
			currency: order.currency,
			type: order.type,
			status: order.status,
			stripe_price_id: order.stripePriceId ?? null,
			stripe_payment_intent: order.stripePaymentIntent ?? null,
			stripe_invoice_id: order.stripeInvoiceId ?? null,
			stripe_subscription_id: order.stripeSubscriptionId ?? null,
			utm_source: order.purchaseUtmSource ?? null,
			utm_medium: order.purchaseUtmMedium ?? null,
			utm_campaign: order.purchaseUtmCampaign ?? null,
			paid_at: order.paidAt,
			refunded_at: order.refundedAt ?? null,
			created_at: order.createdAt,
			user: order.user
				? {
						id: order.user.id,
						email: order.user.email ?? order.user.emails?.[0]?.email ?? null,
						first_name: order.user.firstName ?? null,
						last_name: order.user.lastName ?? null,
					}
				: null,
			product: order.product
				? {
						id: order.product.id,
						name: order.product.name,
						slug: order.product.slug ?? null,
					}
				: null,
			price: order.price
				? {
						id: order.price.id,
						product_price_name: order.price.productPriceName,
						price_type: order.price.priceType,
						price_period: order.price.pricePeriod ?? null,
					}
				: null,
		};
	}
}
