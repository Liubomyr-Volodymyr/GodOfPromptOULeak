import { Products } from '../../user-products/entities/products.entity';
import { ProductPrices } from '../../user-products/entities/product-prices.entity';

export class ProductDetailsDto {
	product: Products;
	prices: ProductPrices[];
}
