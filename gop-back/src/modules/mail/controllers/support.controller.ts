import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { MailerService } from '../../../infra/mailer/services/mailer.service';
import { SupportListDto } from '../../../infra/mailer/dto';
import { JwtAuthGuard } from '../../auth/guards';
import { ApiSupportMail } from '../docs/api-support-list.decorator';

@ApiTags('Mail')
@ApiBearerAuth('access_token')
@Controller('mail')
export class SupportController {
	constructor(private readonly mailService: MailerService) {}

	@Post('support')
	@ApiSupportMail()
	@UseGuards(JwtAuthGuard)
	async sendSupport(@Body() dto: SupportListDto, @Req() req: Request) {
		const email = req.user.email;
		return this.mailService.sendSupportList(email, {
			subject: dto.subject,
			message: dto.message,
		});
	}
}
