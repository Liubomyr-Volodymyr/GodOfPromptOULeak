import { Module } from '@nestjs/common';
import { ProductsController } from './controllers/products.controller';
import { ProductsService } from './services/products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Products } from '../user-products/entities/products.entity';
import { ProductPrices } from '../user-products/entities/product-prices.entity';
import { StripeModule } from '../../infra/stripe/stripe.module';

@Module({
	imports: [TypeOrmModule.forFeature([Products, ProductPrices]), StripeModule],
	controllers: [ProductsController],
	providers: [ProductsService],
})
export class ProductsModule {}
