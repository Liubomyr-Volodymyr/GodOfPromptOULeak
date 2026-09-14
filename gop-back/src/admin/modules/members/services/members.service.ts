import { BadGatewayException, BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { FindAllMembersDto, UserSortBy, USER_SORT_COLUMN } from '../dto/find-all-members.dto';
import { PaginationItems } from '../../../common/dto/pagination.dto';
import { ResetMemberPasswordDto } from '../dto/reset-member-password.dto';
import { USER_HASH_SALT } from '../../../../common/constants';
import { RefundDto } from '../dto/refund.dto';
import { SortOrder } from '../../../../common/enums';
import { CreateMemberDto } from '../dto/create-member.dto';
import { UsersService } from '../../../../modules/users/services/users.service';
import { BanMemberDto } from '../dto/ban-member.dto';
import { MailerService } from '../../../../infra/mailer/services/mailer.service';
import SuccessDto from '../../../../common/dto/success.dto';
import { LoggerService } from '../../../../infra/logger/services/logger.service';
import { UpdateCustomerProductsDto } from '../dto/update-customer-products.dto';
import { UpdateMemberDto } from '../dto/update-member.dto';
import { FindMemberActivityDto } from '../dto/find-member-activity.dto';
import { UserProductEventService } from '../../../../modules/user-products/services/user-product-event.service';
import { StripeService } from '../../../../modules/billing/stripe/services/stripe.service';
import { User } from '../../../../modules/users/entities/users.entity';
import { UserProducts } from '../../../../modules/user-products/entities/user-products.entity';
import { UserSegment } from '../../../../modules/segments/entities/user-segments.entity';
import { PromptBookmark } from '../../../../modules/library/entities/prompt-bookmarks.entity';
import { PromptLikes } from '../../../../modules/library/entities/prompt-likes.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { MemberPromptInteractionDto } from '../dto/member-prompt-interaction.dto';
import { MemberProductDto } from '../dto/member-product.dto';

export interface IMemberSegmentView {
	id: string;
	user_id: string;
	segments_id: { id: string; name: string } | null;
}

export interface IMemberView {
	id: string;
	first_name: string | null;
	last_name: string | null;
	current_status: string | null;
	avatar: string | null;
	primary_email: { email: string | null; is_verified: boolean };
	segments: IMemberSegmentView[];
	user_products: MemberProductDto[];
	connected_with: 'email' | 'google';
	date_created: Date | null;
}

@Injectable()
export class MembersService {
	constructor(
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,

		@InjectRepository(PromptBookmark)
		private readonly promptBookmarksRepository: Repository<PromptBookmark>,

		@InjectRepository(PromptLikes)
		private readonly promptLikesRepository: Repository<PromptLikes>,

		private readonly logger: LoggerService,
		private readonly usersService: UsersService,
		private readonly mailerService: MailerService,
		private readonly stripeService: StripeService,
		private readonly userProductService: UserProductEventService,
	) {}

	private toMemberProductViews(user: User): MemberProductDto[] {
		return (user.products ?? [])
			.filter((userProduct: UserProducts): boolean => userProduct.product?.name !== 'Custom Prompt')
			.map(
				(userProduct: UserProducts): MemberProductDto => ({
					id: userProduct.id,
					user_id: user.id,
					access_type: userProduct.accessType,
					status: userProduct.status,
					granted_at: userProduct.grantedAt ?? null,
					expires_at: userProduct.expiresAt ?? null,
					stripe_one_time_purchase_id: userProduct.stripeOneTimePurchaseId ?? null,
					stripe_subscription_id: userProduct.stripeSubscriptionId ?? null,
					payment_intent: userProduct.paymentIntent ?? null,
					created_at: userProduct.createdAt,
					updated_at: userProduct.updatedAt ?? null,
					product: userProduct.product
						? {
								id: userProduct.product.id,
								name: userProduct.product.name,
								type: userProduct.product.type,
								status: userProduct.product.status,
								slug: userProduct.product.slug,
							}
						: null,
					price: userProduct.price
						? {
								id: userProduct.price.id,
								price: userProduct.price.price,
								currency: userProduct.price.currency,
								price_type: userProduct.price.priceType,
								price_period: userProduct.price.pricePeriod ?? null,
								stripe_price_id: userProduct.price.stripePriceId,
								product_price_name: userProduct.price.productPriceName,
							}
						: null,
				}),
			);
	}

	async getMemberProducts(userId: string): Promise<MemberProductDto[]> {
		const user: User | null = await this.userRepo.findOne({
			where: { id: userId },
			relations: ['products', 'products.product', 'products.price'],
		});

		if (!user) throw new BadRequestException('User not found');

		return this.toMemberProductViews(user);
	}

	private toMemberView(user: User): IMemberView {
		return {
			id: user.id,
			first_name: user.firstName ?? null,
			last_name: user.lastName ?? null,
			current_status: user.currentStatus ?? null,
			avatar: user.avatar ?? null,
			primary_email: {
				email: user.email ?? user.emails?.[0]?.email ?? null,
				is_verified: user.isVerified ?? false,
			},
			segments: (user.segments ?? []).map(
				(userSegment: UserSegment): IMemberSegmentView => ({
					id: String(userSegment.id),
					user_id: user.id,
					segments_id: userSegment.segment ? { id: userSegment.segment.id, name: userSegment.segment.name } : null,
				}),
			),
			user_products: this.toMemberProductViews(user),
			connected_with: user.password ? 'email' : 'google',
			date_created: user.createdAt ?? null,
		};
	}

	async findAll(dto: FindAllMembersDto): Promise<PaginationItems<IMemberView>> {
		try {
			const { page, product, limit, search, sortBy = UserSortBy.DATE_CREATED, sortOrder = SortOrder.DESC, dateFrom, dateTo } = dto;

			const qb = this.userRepo
				.createQueryBuilder('user')
				.leftJoinAndSelect('user.emails', 'email')
				.leftJoinAndSelect('user.products', 'userProducts')
				.leftJoinAndSelect('userProducts.product', 'product')
				.leftJoinAndSelect('userProducts.price', 'price')
				.leftJoinAndSelect('user.segments', 'userSegments')
				.leftJoinAndSelect('userSegments.segment', 'segment');

			// ---- search
			if (search) {
				qb.andWhere(`(email.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)`, {
					search: `%${search}%`,
				});
			}

			// ---- product filter
			if (product) {
				qb.andWhere(`price.productPriceName = :product`, { product }).andWhere(`userProducts.status = :status`, {
					status: 'active',
				});
			}

			// ---- date filter
			if (dateFrom) {
				qb.andWhere(`user.createdAt >= :dateFrom`, { dateFrom });
			}

			if (dateTo) {
				qb.andWhere(`user.createdAt <= :dateTo`, { dateTo });
			}

			const orderColumn = USER_SORT_COLUMN[sortBy] ?? USER_SORT_COLUMN[UserSortBy.DATE_CREATED];

			qb.orderBy(orderColumn, sortOrder.toUpperCase() as 'ASC' | 'DESC');

			qb.skip((page - 1) * limit).take(limit);

			const [items, total] = await qb.getManyAndCount();

			return {
				items: items.map((user: User): IMemberView => this.toMemberView(user)),
				meta: {
					total,
					page,
					limit,
					pageCount: Math.ceil(total / limit),
					hasNextPage: page * limit < total,
				},
			};
		} catch (error) {
			this.logger.error(error);
			throw new BadGatewayException('Failed to fetch members');
		}
	}

	// Activity logging is not persisted yet (UserActivityService TODO) — honest empty pages until it is
	async getAllActivities(dto: FindMemberActivityDto): Promise<PaginationItems<never>> {
		return this.emptyActivityPage(dto);
	}

	async getMemberActivity(userId: string, dto: FindMemberActivityDto): Promise<PaginationItems<never>> {
		return this.emptyActivityPage(dto);
	}

	private emptyActivityPage(dto: FindMemberActivityDto): PaginationItems<never> {
		return {
			items: [],
			meta: {
				total: 0,
				page: Number(dto.page) || 1,
				limit: Number(dto.limit) || 20,
				pageCount: 0,
				hasNextPage: false,
			},
		};
	}

	async getMemberBookmarks(userId: string, dto: PaginationQueryDto): Promise<PaginationItems<MemberPromptInteractionDto>> {
		return this.getMemberPromptInteractions(this.promptBookmarksRepository, userId, dto);
	}

	async getMemberLikes(userId: string, dto: PaginationQueryDto): Promise<PaginationItems<MemberPromptInteractionDto>> {
		return this.getMemberPromptInteractions(this.promptLikesRepository, userId, dto);
	}

	private async getMemberPromptInteractions(
		repository: Repository<PromptBookmark> | Repository<PromptLikes>,
		userId: string,
		dto: PaginationQueryDto,
	): Promise<PaginationItems<MemberPromptInteractionDto>> {
		const page: number = Number(dto.page) || 1;
		const limit: number = Number(dto.limit) || 20;
		const sortOrder: SortOrder = dto.sortOrder === SortOrder.ASC ? SortOrder.ASC : SortOrder.DESC;

		const [rows, total]: [(PromptBookmark | PromptLikes)[], number] = await repository.findAndCount({
			where: { userId },
			relations: ['prompt'],
			order: { createdAt: sortOrder },
			skip: (page - 1) * limit,
			take: limit,
		});

		const items: MemberPromptInteractionDto[] = rows.map(
			(row: PromptBookmark | PromptLikes): MemberPromptInteractionDto => ({
				id: String(row.id),
				prompt_id: row.prompt?.id ?? null,
				prompt_name: row.prompt?.promptName ?? null,
				slug: row.prompt?.slug ?? null,
				created_at: row.createdAt,
			}),
		);

		return {
			items,
			meta: {
				total,
				page,
				limit,
				pageCount: Math.ceil(total / limit),
				hasNextPage: page * limit < total,
			},
		};
	}

	async updateMember(userId: string, dto: UpdateMemberDto): Promise<IMemberView> {
		const user: User | null = await this.userRepo.findOne({ where: { id: userId } });

		if (!user) throw new BadRequestException('User not found');

		if (dto.first_name !== undefined) user.firstName = dto.first_name;
		if (dto.last_name !== undefined) user.lastName = dto.last_name;
		if (dto.current_status !== undefined) user.currentStatus = dto.current_status;

		await this.userRepo.save(user);

		const reloaded: User | null = await this.userRepo.findOne({
			where: { id: userId },
			relations: ['emails', 'products', 'products.product', 'products.price', 'segments', 'segments.segment'],
		});

		return this.toMemberView(reloaded ?? user);
	}

	async createMember(dto: CreateMemberDto): Promise<any> {
		const existing = await this.usersService.findUserByEmail(dto.email);

		if (existing) {
			throw new ConflictException('Email already exists');
		}

		const createdUser = await this.usersService.create({
			first_name: dto.first_name,
			last_name: dto.last_name,
			email: dto.email,
			password: dto.password,
			product_updates: false,
			marketing_emails: false,
		});

		return {
			message: 'User created',
			user: createdUser,
		};
	}

	async findMemberById(id: string) {
		return this.userRepo.findOne({
			where: { id },
			relations: ['emails', 'products', 'segments'],
		});
	}

	async banMember(dto: BanMemberDto) {
		const user = await this.userRepo.findOne({
			where: { email: dto.email },
		});

		if (!user) throw new BadRequestException('User not found');

		user.currentStatus = 'blocked';
		await this.userRepo.save(user);

		await this.mailerService.sendMail({
			to: dto.email,
			subject: 'Your account was blocked!',
			template: 'ban-user',
			context: {
				reason: dto.reason ?? 'Your behavior did not comply with the rules of use.',
			},
		});
	}

	private generatePassword(length = 12) {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
		return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
	}

	async resetMemberPassword(dto: ResetMemberPasswordDto) {
		const user = await this.findMemberById(dto.memberId);
		if (!user) throw new BadRequestException('User not found');

		const password = dto.newPassword?.trim()?.length > 0 ? dto.newPassword : this.generatePassword();

		const hashed = await bcrypt.hash(password, USER_HASH_SALT);

		await this.userRepo.update(user.id, { password: hashed });

		return {
			message: 'Password reset successfully',
			password,
		};
	}

	async updateProducts(dto: UpdateCustomerProductsDto): Promise<SuccessDto> {
		try {
			await this.userProductService.handleAdminProductsUpdate({
				...dto,
				userId: dto.user_id,
			});
			return { success: true };
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException(`handleAdminProductsUpdate`);
		}
	}

	async refund(dto: RefundDto) {
		try {
			const result = await this.stripeService.createRefund({
				...dto,
				reason: 'Customer request',
			});

			return result.success
				? { success: true, message: 'Refund processed successfully' }
				: { success: false, message: 'Failed to process refund' };
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException(`Refund failed`);
		}
	}

	async hardDelete(userId: string) {
		await this.userRepo.delete(userId);
	}
}
