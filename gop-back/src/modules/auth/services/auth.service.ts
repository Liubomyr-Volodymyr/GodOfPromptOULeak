import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { MailerService } from '../../../infra/mailer/services/mailer.service';
import { AuthSuccessDto, LoginDto, RefreshTokenDto, RegisterDto, VerifyCodeDto, ForgotPasswordDto } from '../dto';
import { ResetPasswordDto } from '../../users/dto';
import { CONFIG } from '../../../config/enums';
import { UsersService } from '../../users/services/users.service';
import { UserIdentityService } from '../../users/services/user-identity.service';
import { User } from '../../users/entities/users.entity';
import { LoggerService } from '../../../infra/logger/services/logger.service';
import { UsersVerificationService } from '../../users/services/users-verification.service';
import { AuthUser } from '../../../common/types';
import { SegmentsService } from '../../segments/segments.service';
import { SignupEmailService } from './signup-email.service';
import { SegmentsEnum } from '../../segments/segments.enum';

@Injectable()
export class AuthService {
	private readonly nestLogger = new Logger(AuthService.name);
	private frontendUrl: string;

	constructor(
		private readonly configService: ConfigService,
		private readonly logger: LoggerService,
		private readonly usersService: UsersService,
		private readonly identityService: UserIdentityService,
		private readonly validationService: UsersVerificationService,
		private readonly jwtService: JwtService,
		private readonly mailService: MailerService,
		private readonly segmentsService: SegmentsService,
		private readonly signupEmailService: SignupEmailService,
		@InjectDataSource()
		private readonly dataSource: DataSource,
	) {
		this.frontendUrl = this.configService.get(CONFIG.FRONTEND_URL);
	}

	async register(dto: RegisterDto) {
		try {
			const existingEmail = await this.identityService.findEmailByAddress(dto.email);

			if (existingEmail) {
				throw new ConflictException('Email already exists, try to login or reset your password.');
			}

			const user: User = await this.dataSource.transaction(async (manager: EntityManager): Promise<User> => {
				const createdUser: User = await this.usersService.create(
					{
						first_name: dto.first_name,
						last_name: dto.last_name,
						email: dto.email,
						password: dto.password,
						product_updates: dto.product_updates,
						marketing_emails: dto.marketing_emails,
					},
					manager,
				);

				if (dto.tracking) {
					await this.usersService.addTrackingData(createdUser.id, dto.tracking, manager);
				}

				const verification = await this.identityService.createVerificationCode(dto.email, manager);

				try {
					await this.mailService.sendMail({
						to: dto.email,
						subject: 'Your Verification Code',
						template: 'verify-email',
						context: {
							code: verification.code,
							userEmail: dto.email,
							baseUrl: this.frontendUrl,
						},
					});
				} catch (mailError) {
					this.logger.error(mailError);
					throw new BadRequestException('Failed to send verification email');
				}

				return createdUser;
			});

			await this.addGopFreeSegment(user.id);

			await this.signupEmailService.sendSignupEmail({
				userId: user.id,
				email: dto.email,
				firstName: user.firstName,
				lastName: user.lastName,
				productSlug: dto.tracking?.product_slug,
			});

			return { message: 'Registration successful. Please check your email for verification code.', userId: user.id };
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	async login(dto: LoginDto) {
		const user = await this.identityService.findByEmail(dto.email);

		if (user.currentStatus === 'blocked') {
			throw new ForbiddenException('Your account was blocked');
		}

		if (!user.password) {
			throw new UnauthorizedException('Invalid credentials. Try a different sign-in method.');
		}

		await this.identityService.verifyPassword(dto.password, user.password);

		if (!user?.isVerified) {
			const verification = await this.identityService.createVerificationCode(dto.email);

			await this.mailService.sendMail({
				to: dto.email,
				subject: 'Your Verification Code',
				template: 'verify-email',
				context: {
					code: verification.code,
					userEmail: dto.email,
					baseUrl: this.frontendUrl,
				},
			});

			throw new UnauthorizedException('Email not verified. Please check your inbox.');
		}

		await this.usersService.updateLastLoginDate(user.id);
		const tokens = this.generateToken({
			userId: user.id,
			email: user?.email,
		});
		return {
			...tokens,
			userId: user.id,
		};
	}

	private generateToken(user: AuthUser): AuthSuccessDto {
		const payload = {
			userId: user.userId,
			email: user.email,
		};

		const access_token = this.jwtService.sign(payload);
		const refresh_token = this.jwtService.sign(payload, {
			expiresIn: this.configService.get<string>(CONFIG.JWT_REFRESH_EXPIRES_IN),
		});

		return { access_token, refresh_token };
	}

	issueTokenFor(user: AuthUser): AuthSuccessDto {
		return this.generateToken(user);
	}

	async refreshToken(dto: RefreshTokenDto): Promise<AuthSuccessDto> {
		try {
			const payload = this.jwtService.verify(dto.refresh_token, {
				secret: this.configService.get(CONFIG.JWT_SECRET),
			});

			const user = await this.identityService.findByEmail(payload.email);

			return this.generateToken({
				userId: user.id,
				email: user?.email,
			});
		} catch {
			throw new UnauthorizedException('Invalid or expired refresh token');
		}
	}

	async forgotPassword(dto: ForgotPasswordDto) {
		const genericResponse = { message: 'Reset link sent' };

		let user: User | null = null;
		try {
			user = await this.identityService.findByEmail(dto.email);
		} catch {
			return genericResponse;
		}

		const token = this.jwtService.sign(
			{
				userId: user.id,
				purpose: 'password_reset',
			},
			{ expiresIn: '10m' },
		);

		const resetLink = `${this.frontendUrl}/reset-password/?token=${token}`;

		await this.mailService.sendMail({
			to: dto.email,
			subject: 'Reset password link',
			template: 'reset-password',
			context: { resetLink },
		});

		return genericResponse;
	}

	async resetPassword(dto: ResetPasswordDto) {
		try {
			const payload = this.jwtService.verify(dto.token, {
				secret: this.configService.get<string>(CONFIG.JWT_SECRET),
			});

			if (payload.purpose !== 'password_reset') {
				throw new UnauthorizedException('Invalid token purpose');
			}

			await this.identityService.resetPassword(payload.userId, dto.password);
			return { message: 'Password reset successful', userId: payload.userId };
		} catch {
			throw new BadRequestException('Invalid or expired token');
		}
	}

	async verifyCode(dto: VerifyCodeDto) {
		const user = await this.identityService.findByEmail(dto.email);

		if (user.isVerified) {
			throw new ConflictException('Email already verified');
		}

		await this.identityService.verifyEmailCode(dto.email, dto.code);

		return this.generateToken({
			userId: user.id,
			email: user.email,
		});
	}

	async resendCode(email: string) {
		const user = await this.identityService.findByEmail(email);

		if (user?.isVerified) {
			throw new ConflictException('Email already verified');
		}

		const verification = await this.identityService.createVerificationCode(email);

		await this.mailService.sendMail({
			to: email,
			subject: 'Your Verification Code',
			template: 'verify-email',
			context: {
				code: verification.code,
				userEmail: email,
				baseUrl: this.configService.get(CONFIG.FRONTEND_URL),
			},
		});

		return { message: 'Verification Code sent' };
	}

	private async addGopFreeSegment(userId: string): Promise<void> {
		try {
			const segmentId = await this.segmentsService.getOrCreateSegmentByName(
				SegmentsEnum.GOP_FREE,
				'Free tier users — automatically added on account creation',
			);
			await this.segmentsService.addUserToSegment(userId, segmentId);
			this.nestLogger.log(`[Segment] Added user ${userId} to gop-free segment`);
		} catch (err: unknown) {
			this.nestLogger.error(`Failed to add user ${userId} to gop-free segment: ${err}`);
		}
	}

	async validateUser(payload: AuthUser): Promise<User> {
		return await this.usersService.findUserById(payload.userId);
	}

	async validateGoogleUser(profile: { email: string; firstName?: string; lastName?: string }) {
		let user: User | null = null;

		try {
			user = await this.identityService.findByEmail(profile.email);
		} catch {}

		if (user) {
			if (user.currentStatus === 'blocked') {
				throw new ForbiddenException('Your account was blocked');
			}

			if (!user.isVerified) {
				await this.validationService.markEmailAsVerified(user.email);
			}

			return user;
		}

		const createdUser = await this.usersService.create({
			first_name: profile.firstName,
			last_name: profile.lastName,
			email: profile.email,
			password: null,
			product_updates: true,
			marketing_emails: true,
		});

		await this.addGopFreeSegment(createdUser.id);

		await this.signupEmailService.sendSignupEmail({
			userId: createdUser.id,
			email: profile.email,
			firstName: createdUser.firstName,
			lastName: createdUser.lastName,
		});

		await this.identityService.findOrCreateEmail(profile.email, createdUser.id, true);

		return this.identityService.findByEmail(profile.email);
	}
}
