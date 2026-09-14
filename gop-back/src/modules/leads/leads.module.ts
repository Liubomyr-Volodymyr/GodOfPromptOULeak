import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsController } from './controllers/leads.controller';
import { LeadsService } from './services/leads.service';
import { UsersModule } from '../users/users.module';
import { MailerModule } from '../../infra/mailer/mailer.module';
import { Products } from '../user-products/entities/products.entity';

@Module({
	imports: [UsersModule, MailerModule, TypeOrmModule.forFeature([Products])],
	controllers: [LeadsController],
	providers: [LeadsService],
})
export class LeadsModule {}
