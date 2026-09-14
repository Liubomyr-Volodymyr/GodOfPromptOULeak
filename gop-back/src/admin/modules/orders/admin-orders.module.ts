import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminOrdersController } from './orders.controller';
import { AdminOrdersService } from './services/admin-orders.service';
import { Orders } from '../../../modules/orders/entities/orders.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Orders])],
	controllers: [AdminOrdersController],
	providers: [AdminOrdersService],
	exports: [AdminOrdersService],
})
export class AdminOrdersModule {}
