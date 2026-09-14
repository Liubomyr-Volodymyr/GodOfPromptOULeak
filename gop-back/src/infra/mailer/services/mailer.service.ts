import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as postmark from 'postmark';
import dayjs from 'dayjs';
import * as Handlebars from 'handlebars';
import { SendMailDto, SendMailByTemplateIdDto, SupportListDto } from '../dto';
import { CONFIG } from '../../../config/enums';
import { IMailer } from '../mailer.interface';

@Injectable()
export class MailerService implements IMailer {
	private readonly postmarkClient: postmark.ServerClient | null = null;
	private logger = new Logger(MailerService.name);

	constructor(private readonly configService: ConfigService) {
		const postmarkApiKey = this.configService.get(CONFIG.POSTMARK_API_KEY);

		this.postmarkClient = new postmark.ServerClient(postmarkApiKey);

		Handlebars.registerHelper('year', () => dayjs().format('YYYY'));
		Handlebars.registerHelper('formLink', () => this.configService.get(CONFIG.URL_GENERATE_FORM) || '');
		Handlebars.registerHelper('email', () => this.configService.get(CONFIG.MAIL_USER) || '');

		this.verifyConnection()
			.then((isConnected) => {
				if (!isConnected) {
					this.logger.error('Failed to establish Postmark connection');
				} else {
					this.logger.log('Postmark connection established successfully');
				}
			})
			.catch((error) => {
				this.logger.error('Error during Postmark connection verification:', error);
			});
	}

	async sendMail(sendMailDto: SendMailDto): Promise<boolean> {
		if (!this.postmarkClient) {
			this.logger.warn('MailService is disabled or not properly configured. Skipping sending email.');
			return false;
		}

		try {
			const fromName = this.configService.get(CONFIG.EMAIL_FROM_NAME);
			const fromEmail = this.configService.get(CONFIG.EMAIL_FROM_ADDRESS);

			const result = await this.postmarkClient.sendEmailWithTemplate({
				From: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
				To: sendMailDto.to as string,
				TemplateAlias: sendMailDto.template,
				TemplateModel: sendMailDto.context ?? {},
			});

			if (result.ErrorCode !== 0) {
				this.logger.error(`Postmark error: ${result.Message} (Code: ${result.ErrorCode})`);
				throw new InternalServerErrorException(`Postmark error: ${result.Message || 'Unknown error'}`);
			}

			return true;
		} catch (error) {
			this.logger.error('Error while sending email:', error.message || error, error.stack);
			throw new InternalServerErrorException(`Error while sending email: ${error.message || 'Unknown error'}`);
		}
	}

	async sendMailByTemplateId(dto: SendMailByTemplateIdDto): Promise<boolean> {
		if (!this.postmarkClient) {
			this.logger.warn('MailService is disabled or not properly configured. Skipping sending email.');
			return false;
		}

		try {
			const fromName = this.configService.get(CONFIG.EMAIL_FROM_NAME);
			const fromEmail = this.configService.get(CONFIG.EMAIL_FROM_ADDRESS);

			const result = await this.postmarkClient.sendEmailWithTemplate({
				From: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
				To: dto.to,
				TemplateId: dto.templateId,
				TemplateModel: dto.context ?? {},
			});

			if (result.ErrorCode !== 0) {
				this.logger.error(`Postmark error: ${result.Message} (Code: ${result.ErrorCode})`);
				throw new InternalServerErrorException(`Postmark error: ${result.Message || 'Unknown error'}`);
			}

			return true;
		} catch (error) {
			this.logger.error('Error while sending email:', error.message || error, error.stack);
			throw new InternalServerErrorException(`Error while sending email: ${error.message || 'Unknown error'}`);
		}
	}

	async sendSupportList(from: string, dto: SupportListDto): Promise<any> {
		const supportEmail = this.configService.get(CONFIG.SUPPORT_EMAIL);

		if (!supportEmail) {
			this.logger.error('SUPPORT_EMAIL is not set in environment');
			throw new InternalServerErrorException('Support email not configured');
		}

		const sent = await this.sendMail({
			to: supportEmail.trim(),
			subject: dto.subject,
			template: 'support-message',
			context: {
				from,
				message: dto.message,
			},
		});

		if (!sent) {
			throw new InternalServerErrorException('Failed to send support email');
		}

		this.logger.log(`Support email sent to ${supportEmail}`);
		return {
			message: 'Support email sent successfully',
		};
	}

	private async verifyConnection(): Promise<boolean> {
		if (!this.postmarkClient) return false;
		try {
			await this.postmarkClient.getServer();
			return true;
		} catch (error) {
			this.logger.error('Failed to verify Postmark connection:', error);
			return false;
		}
	}
}
