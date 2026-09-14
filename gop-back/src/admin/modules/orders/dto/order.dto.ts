import { ApiProperty } from '@nestjs/swagger';
import { PaginationItems } from '../../../common/dto/pagination.dto';

export class OrderUserDto {
	id: string;

	@ApiProperty({ type: String, nullable: true })
	email: string | null;

	@ApiProperty({ type: String, nullable: true })
	first_name: string | null;

	@ApiProperty({ type: String, nullable: true })
	last_name: string | null;
}

export class OrderProductDto {
	id: string;
	name: string;

	@ApiProperty({ type: String, nullable: true })
	slug: string | null;
}

export class OrderPriceDto {
	id: string;
	product_price_name: string;
	price_type: string;

	@ApiProperty({ type: String, nullable: true })
	price_period: string | null;
}

export class OrderDto {
	id: string;
	amount: number;
	refunded_amount: number;
	currency: string;
	type: string;
	status: string;

	@ApiProperty({ type: String, nullable: true })
	stripe_price_id: string | null;

	@ApiProperty({ type: String, nullable: true })
	stripe_payment_intent: string | null;

	@ApiProperty({ type: String, nullable: true })
	stripe_invoice_id: string | null;

	@ApiProperty({ type: String, nullable: true })
	stripe_subscription_id: string | null;

	@ApiProperty({ type: String, nullable: true })
	utm_source: string | null;

	@ApiProperty({ type: String, nullable: true })
	utm_medium: string | null;

	@ApiProperty({ type: String, nullable: true })
	utm_campaign: string | null;

	paid_at: Date;

	@ApiProperty({ type: Date, nullable: true })
	refunded_at: Date | null;

	created_at: Date;

	@ApiProperty({ type: () => OrderUserDto, nullable: true })
	user: OrderUserDto | null;

	@ApiProperty({ type: () => OrderProductDto, nullable: true })
	product: OrderProductDto | null;

	@ApiProperty({ type: () => OrderPriceDto, nullable: true })
	price: OrderPriceDto | null;
}

export class OrdersPageDto extends PaginationItems<OrderDto> {
	items: OrderDto[];
}

export class OrdersTotalsDto {
	orders_count: number;
	gross_amount: number;
	refunded_amount: number;
	net_amount: number;
}
