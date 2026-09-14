import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CreateUserDto, UpdatePasswordDto, UpdateUserDto } from '../dto';
import { TrackingInfoDto } from '../../auth/dto';
import { UserIdentityService } from './user-identity.service';
import { UserMediaService } from './user-media.service';
import { LoggerService } from '../../../infra/logger/services/logger.service';
import { SegmentsService } from '../../segments/segments.service';
import { SegmentsEnum } from '../../segments/segments.enum';
import { User } from '../entities/users.entity';
import { UserProducts } from '../../user-products/entities/user-products.entity';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
		@InjectRepository(UserProducts)
		private readonly userProductsRepo: Repository<UserProducts>,
		private readonly identity: UserIdentityService,
		private readonly media: UserMediaService,
		private readonly segments: SegmentsService,
		private readonly logger: LoggerService,
	) {}

	async create(dto: CreateUserDto, manager?: EntityManager): Promise<User> {
		const userRepo: Repository<User> = manager ? manager.getRepository(User) : this.userRepo;

		try {
			const normalizedEmail: string = dto.email.toLowerCase().trim();

			const hashedPassword: string | null = dto.password ? await this.identity.hashPassword(dto.password) : null;

			const user: User = userRepo.create({
				firstName: dto.first_name,
				lastName: dto.last_name,
				email: normalizedEmail,
				password: hashedPassword,
				productUpdates: dto.product_updates,
				marketingEmails: dto.marketing_emails,
			});

			const savedUser: User = await userRepo.save(user);

			await this.identity.findOrCreateEmail(normalizedEmail, savedUser.id, false, manager);

			return savedUser;
		} catch (error) {
			this.logger.error(error);
			throw new BadRequestException(error.message);
		}
	}

	async addTrackingData(userId: string, dto: TrackingInfoDto, manager?: EntityManager): Promise<Partial<User> | null> {
		const userRepo: Repository<User> = manager ? manager.getRepository(User) : this.userRepo;

		try {
			if (!Object.keys(dto).length) return null;

			const user = await userRepo.findOne({
				where: { id: userId },
				select: ['id', 'firstUtmMedium', 'firstUtmCampaign', 'firstUtmContent', 'firstUtmTerm', 'leadMagnetSlug'],
			});

			if (!user) {
				throw new NotFoundException('User not found');
			}

			const updatePayload: Partial<typeof user> = {};

			if (!user.firstUtmMedium && dto.utm_medium) updatePayload.firstUtmMedium = dto.utm_medium;
			if (!user.firstUtmCampaign && dto.utm_campaign) updatePayload.firstUtmCampaign = dto.utm_campaign;
			if (!user.firstUtmContent && dto.utm_content) updatePayload.firstUtmContent = dto.utm_content;
			if (!user.firstUtmTerm && dto.utm_term) updatePayload.firstUtmTerm = dto.utm_term;
			if (!user.leadMagnetSlug && dto.product_slug) updatePayload.leadMagnetSlug = dto.product_slug;

			if (!Object.keys(updatePayload).length) {
				return null;
			}

			await userRepo.update({ id: userId }, updatePayload);

			void this.handleTrackingSideEffects(userId, updatePayload);

			return updatePayload;
		} catch (error) {
			this.logger.error(error);
			throw new HttpException('Failed to save tracking', 500);
		}
	}

	async findById(id: string): Promise<User> {
		try {
			const user = await this.userRepo.findOne({ where: { id } });

			if (!user) {
				throw new NotFoundException('User not found');
			}

			return user;
		} catch (err) {
			this.logger.error(err);
			throw new HttpException('Failed to fetch user', 500);
		}
	}

	async update(id: string, payload: Partial<User>) {
		try {
			await this.userRepo.update({ id }, payload);
		} catch (err) {
			this.logger.error(err);
			throw new HttpException('Failed to update user', 500);
		}
	}

	private async handleTrackingSideEffects(userId: string, payload: Partial<User>) {
		try {
			const segmentId = await this.segments.getOrCreateSegmentByName(SegmentsEnum.GOP_FREE);

			await this.segments.addUserToSegment(userId, segmentId, {
				utmMedium: payload?.firstUtmMedium,
				utmSource: payload?.leadMagnetSlug,
				utmCampaign: payload?.firstUtmCampaign,
				productSlug: payload?.firstUtmContent,
			});
		} catch (err) {
			this.logger.error(err);
		}
	}

	async findUserByEmail(email: string) {
		const normalizedEmail = email.toLowerCase().trim();

		try {
			const user = await this.userRepo.findOne({
				where: { email: normalizedEmail },
				relations: ['emails'],
			});

			return user ?? null;
		} catch (err) {
			this.logger.error(err);
			throw new BadRequestException('Failed to fetch user');
		}
	}

	async findUserById(id: string) {
		try {
			const user = await this.userRepo.findOne({
				where: { id },
				relations: ['emails'],
			});

			return user ?? null;
		} catch (err) {
			this.logger.error(err);
			throw new BadRequestException('Failed to fetch user');
		}
	}

	async updateLastLoginDate(userId: string) {
		try {
			await this.userRepo.update(userId, {
				lastLogin: new Date(),
			});
		} catch (err) {
			this.logger.error(err);
			throw new BadRequestException('Failed to update last login');
		}
	}

	async getProfile(email: string) {
		const user = await this.identity.findByEmail(email);

		return {
			first_name: user.firstName,
			last_name: user.lastName,
			email: user.email,
			avatar_id: user.avatar,
			plan: 'free',
			product_statuses: await this.getProductStatuses(user.id),
		};
	}

	async findOrCreateByEmail(email: string) {
		const normalizedEmail = email.toLowerCase().trim();

		const existing = await this.findUserByEmail(normalizedEmail);
		if (existing) return existing;

		try {
			const user = this.userRepo.create({
				email: normalizedEmail,
			});

			const savedUser = await this.userRepo.save(user);

			await this.identity.findOrCreateEmail(normalizedEmail, savedUser.id, false);

			return savedUser;
		} catch (err) {
			this.logger.error(err);
			throw new BadRequestException('Failed to create user');
		}
	}

	async checkIsUserPremium(userId: string): Promise<boolean> {
		try {
			const products = await this.getProductStatuses(userId);
			return products.some((p) => p.status === 'active' && p.product_price_name?.toLowerCase().includes('premium'));
		} catch {
			return false;
		}
	}

	async getProductStatuses(userId: string) {
		try {
			const data = await this.userProductsRepo.find({
				where: {
					user: { id: userId },
				},
				relations: {
					product: true,
					price: true,
				},
			});

			return data.map((p) => ({
				id: p.id,
				status: p.status,
				product_price_name: p.price?.productPriceName,
				product_slug: p.product.slug,
				name: p.product.name,
				type: p.product.type,
			}));
		} catch (e) {
			throw new InternalServerErrorException(e.message);
		}
	}

	async updatePassword(userId: string, dto: UpdatePasswordDto) {
		await this.identity.updatePassword(userId, dto.old_password, dto.new_password);
		return { message: 'Password updated successfully' };
	}

	async updateContact(id: string, dto: UpdateUserDto) {
		try {
			const payload: Partial<User> = {};

			if (dto.first_name) payload.firstName = dto.first_name;
			if (dto.last_name) payload.lastName = dto.last_name;

			if (Object.keys(payload).length) {
				await this.userRepo.update(id, payload);
			}

			return { success: true };
		} catch (err) {
			this.logger.error(err);
			throw new BadRequestException('Failed to update user');
		}
	}

	async deleteAccount(userId: string, password: string) {
		try {
			const user = await this.findUserById(userId);
			if (!user) throw new BadRequestException('User not found');

			await this.identity.verifyPassword(password, user.password);

			await this.userRepo.delete(userId);

			return { success: true };
		} catch (err) {
			if (err instanceof HttpException) throw err;

			this.logger.error(err);
			throw new InternalServerErrorException('Failed to delete account');
		}
	}

	getAvatarUrl(userId: string) {
		return this.media.getAvatarUrl(userId);
	}

	uploadAvatar(userId: string, file: Express.Multer.File) {
		return this.media.uploadAvatar(userId, file);
	}
}
