import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RefundDto {
	@IsString()
	@IsNotEmpty()
	memberId: string;

	@IsString()
	@IsOptional()
	subId: string | null;

	@IsString()
	@IsNotEmpty()
	productId: string;
}
