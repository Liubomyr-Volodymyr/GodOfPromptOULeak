import { Module } from '@nestjs/common';
import { SupportController } from './controllers/support.controller';
import { MailerModule } from '../../infra/mailer/mailer.module';

@Module({
	imports: [MailerModule],
	controllers: [SupportController],
})
export class MailModule {}
