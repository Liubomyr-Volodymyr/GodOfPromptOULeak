import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class UpdateCustomerProductsDto {
	@IsString()
	@IsNotEmpty()
	user_id: string;

	@IsArray()
	@IsString({ each: true })
	price_names: string[];
}
