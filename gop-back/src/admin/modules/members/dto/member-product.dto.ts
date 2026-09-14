import { ApiProperty } from '@nestjs/swagger';

export class MemberProductInfoDto {
	id: string;
	name: string;
	type: string;
	status: string;
	slug: string;
}

export class MemberProductPriceDto {
	id: string;
	price: number;
	currency: string;
	price_type: string;

	@ApiProperty({ type: String, nullable: true })
	price_period: string | null;

	stripe_price_id: string;
	product_price_name: string;
}

export class MemberProductDto {
	id: string;
	user_id: string;
	access_type: string;
	status: string;

	@ApiProperty({ type: Date, nullable: true })
	granted_at: Date | null;

	@ApiProperty({ type: Date, nullable: true })
	expires_at: Date | null;

	@ApiProperty({ type: String, nullable: true })
	stripe_one_time_purchase_id: string | null;

	@ApiProperty({ type: String, nullable: true })
	stripe_subscription_id: string | null;

	@ApiProperty({ type: String, nullable: true })
	payment_intent: string | null;

	created_at: Date;

	@ApiProperty({ type: Date, nullable: true })
	updated_at: Date | null;

	@ApiProperty({ type: () => MemberProductInfoDto, nullable: true })
	product: MemberProductInfoDto | null;

	@ApiProperty({ type: () => MemberProductPriceDto, nullable: true })
	price: MemberProductPriceDto | null;
}
