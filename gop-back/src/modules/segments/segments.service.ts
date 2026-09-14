import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Segment } from './entities/segments.entity';
import { UserSegment } from './entities/user-segments.entity';
import { SegmentsEnum } from './segments.enum';
import { BeehiivService } from '../../infra/beehiiv/beehiiv.service';
import { ProductPrices } from '../user-products/entities/product-prices.entity';
import { User } from '../users/entities/users.entity';

export interface SegmentUtmOpts {
	utmSource?: string;
	utmMedium?: string;
	utmCampaign?: string;
	productSlug?: string;
}

@Injectable()
export class SegmentsService {
	private readonly logger = new Logger(SegmentsService.name);

	constructor(
		@InjectRepository(Segment)
		private readonly segmentRepo: Repository<Segment>,

		@InjectRepository(UserSegment)
		private readonly userSegmentRepo: Repository<UserSegment>,

		@InjectRepository(User)
		private readonly userRepo: Repository<User>,

		private readonly beehiiv: BeehiivService,
	) {}

	async getOrCreateSegment(price: ProductPrices): Promise<string> {
		try {
			const stripePriceId: string = price.id;

			let segment = await this.segmentRepo.findOne({
				where: { stripePriceId },
			});

			if (segment) {
				this.logger.log(`Found existing segment: ${segment.name} (${segment.id})`);
				return segment.id;
			}

			const segmentName: string = price.productPriceName;

			if (!segmentName) {
				throw new InternalServerErrorException(`Cannot determine segment name for price ${stripePriceId}`);
			}

			segment = this.segmentRepo.create({
				name: segmentName,
				stripePriceId,
				description: `Auto-generated segment for ${price.product.name} subscribers with ${segmentName} pricing`,
				isActive: true,
			} as DeepPartial<Segment>);

			const saved = await this.segmentRepo.save(segment);

			this.logger.log(`Created new segment: ${saved.name} (${saved.id})`);
			return saved.id;
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException('Failed to get or create segment');
		}
	}

	async getOrCreateSegmentByName(segmentName: string, description?: string): Promise<string> {
		try {
			let segment = await this.segmentRepo.findOne({
				where: { name: segmentName },
			});

			if (segment) {
				this.logger.log(`Found existing segment: ${segment.name} (${segment.id})`);
				return segment.id;
			}

			segment = this.segmentRepo.create({
				name: segmentName,
				description: description ?? `Auto-generated segment: ${segmentName}`,
				isActive: true,
			} as DeepPartial<Segment>);

			const saved = await this.segmentRepo.save(segment);

			this.logger.log(`Created new segment: ${saved.name} (${saved.id})`);
			return saved.id;
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException('Failed to create segment by name');
		}
	}

	async addUserToSegment(userId: string, segmentId: string, opts?: SegmentUtmOpts): Promise<boolean> {
		try {
			this.logger.log(`➕ addUserToSegment: user=${userId} segment=${segmentId}`);

			const existing = await this.userSegmentRepo.findOne({
				where: {
					user: { id: userId },
					segment: { id: segmentId },
				},
				relations: ['user', 'segment'],
			});

			if (!existing) {
				const relation = this.userSegmentRepo.create({
					user: { id: userId } as User,
					segment: { id: segmentId } as Segment,
				});

				await this.userSegmentRepo.save(relation);

				this.logger.log(`Added user ${userId} to segment ${segmentId}`);
			} else {
				this.logger.log(`User already in segment ${segmentId}`);
			}

			await this.syncSegmentToBeehiiv(userId, segmentId, opts);

			return true;
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException('Failed to add user to segment');
		}
	}

	async removeUserFromSegmentByName(userId: string, segmentName: string): Promise<boolean> {
		try {
			this.logger.log(`➖ removeUserFromSegmentByName: user=${userId} segment=${segmentName}`);

			const segment = await this.segmentRepo.findOne({
				where: { name: segmentName },
			});

			if (!segment) {
				this.logger.warn(`Segment '${segmentName}' not found`);
				return false;
			}

			const relations = await this.userSegmentRepo.find({
				where: {
					user: { id: userId },
					segment: { id: segment.id },
				},
			});

			if (relations.length) {
				await this.userSegmentRepo.remove(relations);
				this.logger.log(`Removed user ${userId} from segment ${segmentName}`);
			}

			await this.removeSegmentFromBeehiiv(userId, segmentName);

			return true;
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException('Failed to remove user from segment');
		}
	}

	async handleTrialAndFreeSegments(userId: string, status: string, opts?: SegmentUtmOpts): Promise<void> {
		if (status === 'trialing') {
			try {
				const trialSegmentId = await this.getOrCreateSegmentByName(
					SegmentsEnum.GOP_ON_TRIAL,
					'Users currently on a trial subscription',
				);

				await this.addUserToSegment(userId, trialSegmentId, opts);

				this.logger.log(`Added user ${userId} to trial segment`);
			} catch (err) {
				this.logger.error(`Failed trial segment logic: ${err}`);
			}
		} else {
			try {
				await this.removeUserFromSegmentByName(userId, 'gop-free');
			} catch (err) {
				this.logger.error(`Failed removing free segment: ${err}`);
			}
		}
	}

	// -------------------------
	// USER EMAIL FETCH
	// -------------------------
	private async getUserWithEmail(userId: string) {
		const user = await this.userRepo.findOne({
			where: { id: userId },
			relations: ['primaryEmail'],
		});

		if (!user?.email) return null;

		return {
			email: user.email,
			utmSource: user.firstUtmSource,
			utmMedium: user.firstUtmMedium,
			utmCampaign: user.firstUtmCampaign,
			leadMagnetSlug: user.leadMagnetSlug,
		};
	}

	private async syncSegmentToBeehiiv(userId: string, segmentId: string, opts?: SegmentUtmOpts): Promise<void> {
		if (!this.beehiiv.isEnabled()) return;

		let userInfo = await this.getUserWithEmail(userId);
		if (!userInfo) return;

		const segment = await this.segmentRepo.findOne({
			where: { id: segmentId },
		});

		if (!segment?.name) return;

		for (const pub of this.beehiiv.getPublications()) {
			try {
				let subscriber = await this.beehiiv.getSubscriberByEmail(userInfo.email, pub.id);
				let subscriberId = subscriber?.data?.id;

				if (!subscriberId) {
					const created = await this.beehiiv.createSubscriber({
						email: userInfo.email,
						publicationId: pub.id,
						utmSource: opts?.utmSource ?? userInfo.utmSource,
						utmMedium: opts?.utmMedium ?? userInfo.utmMedium,
						utmCampaign: opts?.utmCampaign ?? userInfo.utmCampaign,
						productSlug: opts?.productSlug ?? userInfo.leadMagnetSlug,
					});

					subscriberId = created?.data?.id;
					if (!subscriberId) continue;
				}

				const fields = subscriber?.data?.custom_fields ?? [];
				const segmentField = fields.find((f: any) => f.name === 'segment_value');

				const current: string[] = segmentField?.value ?? [];

				if (!current.includes(segment.name)) {
					await this.beehiiv.updateCustomField(subscriberId, 'segment_value', [...current, segment.name], pub.id);
				}
			} catch (err) {
				this.logger.error(`Beehiiv sync failed: ${err}`);
			}
		}
	}

	private async removeSegmentFromBeehiiv(userId: string, segmentName: string): Promise<void> {
		if (!this.beehiiv.isEnabled()) return;

		const user = await this.getUserWithEmail(userId);
		if (!user) return;

		for (const pub of this.beehiiv.getPublications()) {
			try {
				const subscriber = await this.beehiiv.getSubscriberByEmail(user.email, pub.id);
				const id = subscriber?.data?.id;
				if (!id) continue;

				const fields = subscriber?.data?.custom_fields ?? [];
				const segmentField = fields.find((f: any) => f.name === 'segment_value');

				const current: string[] = segmentField?.value ?? [];

				if (current.includes(segmentName)) {
					await this.beehiiv.updateCustomField(
						id,
						'segment_value',
						current.filter((s) => s !== segmentName),
						pub.id,
					);
				}
			} catch (err) {
				this.logger.error(err);
			}
		}
	}
}
