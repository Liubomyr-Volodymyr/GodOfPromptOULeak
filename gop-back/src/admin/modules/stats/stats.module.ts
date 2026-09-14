import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductActivityController } from './controllers/product-activity.controller';
import { StatsService } from './services/stats.service';
import { StripeModule as StripeClientModule } from '../../../infra/stripe/stripe.module';
import { UserProducts } from '../../../modules/user-products/entities/user-products.entity';

@Module({
	imports: [TypeOrmModule.forFeature([UserProducts]), StripeClientModule],
	providers: [StatsService],
	controllers: [ProductActivityController],
})
export class StatsModule {}
