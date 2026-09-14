import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SortOrder } from '../../../../common/enums';
import { OrderStatusEnum, OrderTypeEnum } from '../../../../modules/orders/entities/orders.entity';

export enum OrderSortBy {
	PAID_AT = 'paid_at',
	AMOUNT = 'amount',
	CREATED_AT = 'created_at',
}

export const ORDER_SORT_COLUMN: Record<OrderSortBy, string> = {
	[OrderSortBy.PAID_AT]: 'orders.paidAt',
	[OrderSortBy.AMOUNT]: 'orders.amount',
	[OrderSortBy.CREATED_AT]: 'orders.createdAt',
};

export class FindAllOrdersDto {
	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsUUID()
	user_id?: string;

	@IsOptional()
	@IsUUID()
	product_id?: string;

	@IsOptional()
	@IsEnum(OrderStatusEnum)
	status?: OrderStatusEnum;

	@IsOptional()
	@IsEnum(OrderTypeEnum)
	type?: OrderTypeEnum;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	limit?: number = 20;

	@IsOptional()
	@IsEnum(OrderSortBy)
	sortBy?: OrderSortBy = OrderSortBy.PAID_AT;

	@IsOptional()
	@IsEnum(SortOrder)
	@IsIn(Object.values(SortOrder))
	sortOrder?: SortOrder.ASC | SortOrder.DESC = SortOrder.DESC;

	@IsOptional()
	@IsString()
	dateFrom?: string;

	@IsOptional()
	@IsString()
	dateTo?: string;
}
