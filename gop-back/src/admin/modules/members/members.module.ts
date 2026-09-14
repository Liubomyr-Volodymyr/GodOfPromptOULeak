import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersController } from './members.controller';
import { MembersService } from './services/members.service';
import { UsersModule } from '../../../modules/users/users.module';
import { MailerModule } from '../../../infra/mailer/mailer.module';
import { UserProductsModule } from '../../../modules/user-products/user-products.module';
import { BillingModule } from '../../../modules/billing/billing.module';
import { User } from '../../../modules/users/entities/users.entity';
import { PromptBookmark } from '../../../modules/library/entities/prompt-bookmarks.entity';
import { PromptLikes } from '../../../modules/library/entities/prompt-likes.entity';
import { AdminOrdersModule } from '../orders/admin-orders.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([User, PromptBookmark, PromptLikes]),
		UsersModule,
		MailerModule,
		BillingModule,
		UserProductsModule,
		AdminOrdersModule,
	],
	controllers: [MembersController],
	providers: [MembersService],
})
export class MembersModule {}
