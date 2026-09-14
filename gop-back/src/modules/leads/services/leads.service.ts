import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserIdentityService } from '../../users/services/user-identity.service';
import { BeehiivService, BeehiivPublication } from '../../../infra/beehiiv/beehiiv.service';
import { MailerService } from '../../../infra/mailer/services/mailer.service';
import { CONFIG } from '../../../config/enums';
import { SubmitLeadDto } from '../dto/submit-lead.dto';
import { User } from '../../users/entities/users.entity';
import { Products } from '../../user-products/entities/products.entity';

@Injectable()
export class LeadsService {
	private readonly logger = new Logger(LeadsService.name);

	constructor(
		@InjectDataSource()
		private readonly dataSource: DataSource,
		@InjectRepository(Products)
		private readonly productsRepo: Repository<Products>,
		private readonly identity: UserIdentityService,
		private readonly beehiiv: BeehiivService,
		private readonly mailer: MailerService,
		private readonly config: ConfigService,
	) {}

	async captureLeadForm(dto: SubmitLeadDto): Promise<{ message: string }> {
		const existingUser = await this.identity.findEmailByAddress(dto.email);

		const queryRunner = this.dataSource.createQueryRunner();
		await queryRunner.connect();
		await queryRunner.startTransaction();

		try {
			const userRepo = queryRunner.manager.getRepository(User);

			let user: User;

			if (existingUser) {
				await userRepo.update(existingUser.id, {
					...(dto.lead_magnet_slug && { leadMagnetSlug: dto.lead_magnet_slug }),
					...(dto.utm_source && { firstUtmSource: dto.utm_source }),
					...(dto.utm_medium && { firstUtmMedium: dto.utm_medium }),
					...(dto.utm_campaign && { firstUtmCampaign: dto.utm_campaign }),
					...(dto.utm_content && { firstUtmContent: dto.utm_content }),
					...(dto.utm_term && { firstUtmTerm: dto.utm_term }),
				});
				user = existingUser;
			} else {
				user = userRepo.create({
					firstName: dto.first_name ?? null,
					lastName: dto.last_name ?? null,
					currentStatus: 'lead',
					leadMagnetSlug: dto.lead_magnet_slug ?? null,
					firstUtmSource: dto.utm_source ?? null,
					firstUtmMedium: dto.utm_medium ?? null,
					firstUtmCampaign: dto.utm_campaign ?? null,
					firstUtmContent: dto.utm_content ?? null,
					firstUtmTerm: dto.utm_term ?? null,
				});

				user = await userRepo.save(user);

				await this.identity.findOrCreateEmail(dto.email, user.id, false);
			}

			await queryRunner.commitTransaction();

			if (this.beehiiv.isEnabled()) {
				const publications: BeehiivPublication[] = this.beehiiv.getPublications();
				const results: PromiseSettledResult<unknown>[] = await Promise.allSettled(
					publications.map((pub: BeehiivPublication) =>
						this.beehiiv.createSubscriber({
							email: dto.email,
							publicationId: pub.id,
							utmSource: dto.utm_source,
							utmMedium: dto.utm_medium,
							utmCampaign: dto.utm_campaign,
							productSlug: dto.lead_magnet_slug,
						}),
					),
				);

				results.forEach((result: PromiseSettledResult<unknown>, index: number): void => {
					if (result.status === 'rejected') {
						this.logger.error(
							`Beehiiv subscribe failed for ${dto.email} on publication '${publications[index].name}': ${result.reason}`,
						);
					}
				});
			}

			await this.sendLeadMagnetEmail(dto.email, dto.lead_magnet_slug);

			return { message: 'Lead captured successfully' };
		} catch (error) {
			if (queryRunner.isTransactionActive) {
				await queryRunner.rollbackTransaction();
			}

			throw new HttpException(error.message || 'Failed to capture lead', HttpStatus.INTERNAL_SERVER_ERROR);
		} finally {
			await queryRunner.release();
		}
	}

	private async sendLeadMagnetEmail(email: string, slug?: string): Promise<void> {
		if (!slug) {
			this.logger.warn(`No lead_magnet_slug for ${email} — skipping Postmark delivery`);
			return;
		}

		const templateId = this.config.get<number>(CONFIG.POSTMARK_TEMPLATE_LEAD_MAGNET);
		if (!templateId) {
			this.logger.warn(`POSTMARK_TEMPLATE_LEAD_MAGNET not set — skipping lead-magnet email for ${email}`);
			return;
		}

		const product = await this.productsRepo.findOne({
			where: { slug },
			select: ['id', 'name', 'notionProductAccessUrl'],
		});

		if (!product) {
			this.logger.warn(`Product not found for slug='${slug}' — skipping Postmark delivery for ${email}`);
			return;
		}

		if (!product.notionProductAccessUrl) {
			this.logger.warn(`Product '${slug}' has no notionProductAccessUrl — skipping Postmark delivery for ${email}`);
			return;
		}

		try {
			await this.mailer.sendMailByTemplateId({
				to: email,
				templateId,
				context: {
					product_name: product.name,
					notion_url: product.notionProductAccessUrl,
				},
			});
			this.logger.log(`Lead-magnet email sent to ${email} (template=${templateId}, slug=${slug}, product=${product.name})`);
		} catch (err) {
			this.logger.error(`Failed to send lead-magnet email to ${email}: ${err}`);
		}
	}
}
