import { Products } from '../../user-products/entities/products.entity';

export class ProductsListMetaDto {
	total: number;
	limit: number;
	offset: number;
}

export class ProductsListDto {
	items: Products[];
	meta: ProductsListMetaDto;
}
