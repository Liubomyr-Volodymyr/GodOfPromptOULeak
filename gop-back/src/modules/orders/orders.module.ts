import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orders } from './entities/orders.entity';
import { OrdersService } from './services/orders.service';
import { UserProductsModule } from '../user-products/user-products.module';

@Module({
	imports: [TypeOrmModule.forFeature([Orders]), UserProductsModule],
	providers: [OrdersService],
	exports: [OrdersService],
})
export class OrdersModule {}
