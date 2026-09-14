import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Products } from '../../user-products/entities/products.entity';
import { MailerService } from '../../../infra/mailer/services/mailer.service';
import { CONFIG } from '../../../config/enums';

interface SendSignupEmailOpts {
	userId: string;
	email: string;
	firstName: string;
	lastName: string;
	productSlug?: string;
}

@Injectable()
export class SignupEmailService {
	private readonly logger = new Logger(SignupEmailService.name);

	constructor(
		private readonly mailer: MailerService,
		private readonly config: ConfigService,
		@InjectRepository(Products)
		private readonly productsRepo: Repository<Products>,
	) {}

	async sendSignupEmail(opts: SendSignupEmailOpts): Promise<void> {
		try {
			if (opts.productSlug) {
				await this.sendLeadMagnetEmail(opts);
			} else {
				await this.sendWelcomeEmail(opts);
			}
		} catch (err: unknown) {
			this.logger.error(`Failed to send signup email to ${opts.email}: ${err}`);
		}
	}

	private async sendLeadMagnetEmail(opts: SendSignupEmailOpts): Promise<void> {
		try {
			const templateId = this.config.get<number>(CONFIG.POSTMARK_TEMPLATE_SIGNUP_LEAD_MAGNET);

			if (!templateId) {
				this.logger.warn('POSTMARK_TEMPLATE_SIGNUP_LEAD_MAGNET not configured, skipping lead magnet email');
				return;
			}

			const product = await this.productsRepo.findOne({
				where: { slug: opts.productSlug },
			});

			if (!product) {
				this.logger.warn(`Product not found for slug: ${opts.productSlug}`);
				return;
			}

			if (!product.notionProductAccessUrl) {
				this.logger.warn(`No notion_product_access_url for product: ${opts.productSlug}`);
				return;
			}

			await this.mailer.sendMailByTemplateId({
				to: opts.email,
				templateId,
				context: {
					first_name: opts.firstName,
					last_name: opts.lastName,
					product_name: product.name,
					notion_url: product.notionProductAccessUrl,
				},
			});

			this.logger.log(`[Lead magnet] email sent to ${opts.email} for product: ${opts.productSlug}`);
		} catch (err) {
			this.logger.error(err);
		}
	}

	private async sendWelcomeEmail(opts: SendSignupEmailOpts): Promise<void> {
		try {
			const templateId = this.config.get<number>(CONFIG.POSTMARK_TEMPLATE_SIGNUP_WELCOME);

			if (!templateId) {
				this.logger.warn('POSTMARK_TEMPLATE_SIGNUP_WELCOME not configured, skipping welcome email');
				return;
			}

			await this.mailer.sendMailByTemplateId({
				to: opts.email,
				templateId,
				context: {
					first_name: opts.firstName,
					last_name: opts.lastName,
				},
			});

			this.logger.log(`[Welcome email] sent to ${opts.email}`);
		} catch (err) {
			this.logger.error(err);
		}
	}
}
