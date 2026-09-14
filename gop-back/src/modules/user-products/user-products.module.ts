import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProductsService } from './services/user-products.service';
import { UserProductEventService } from './services/user-product-event.service';
import { SegmentsModule } from '../segments/segments.module';
import { MailerModule } from '../../infra/mailer/mailer.module';
import { UsersModule } from '../users/users.module';
import { UserProducts } from './entities/user-products.entity';
import { ProductPrices } from './entities/product-prices.entity';
import { ProductOutputType } from './entities/products-output-types.entity';
import { OutputTypes } from './entities/output-types.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserProducts, ProductPrices, ProductOutputType, OutputTypes]),
		SegmentsModule,
		MailerModule,
		UsersModule,
	],
	providers: [UserProductsService, UserProductEventService],
	exports: [UserProductEventService, UserProductsService],
})
export class UserProductsModule {}
