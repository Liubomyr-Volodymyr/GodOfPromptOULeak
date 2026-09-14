import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../../users/services/users.service';
import { UsersVerificationService } from '../../users/services/users-verification.service';
import { MailerService } from '../../../infra/mailer/services/mailer.service';
import { LoggerService } from '../../../infra/logger/services/logger.service';
import { UserIdentityService } from '../../users/services/user-identity.service';
import { UserMediaService } from '../../users/services/user-media.service';
import { SegmentsService } from '../../segments/segments.service';
import { SignupEmailService } from './signup-email.service';
import { getDataSourceToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

const transactionManager = {} as EntityManager;

describe('AuthService.register', () => {
	let service: AuthService;
	let usersService: jest.Mocked<UsersService>;
	let identityService: jest.Mocked<UserIdentityService>;
	let mailService: jest.Mocked<MailerService>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: UsersService,
					useValue: {
						findUserByEmail: jest.fn(),
						create: jest.fn(),
						addTrackingData: jest.fn(),
					},
				},
				{
					provide: UsersVerificationService,
					useValue: {},
				},
				{
					provide: JwtService,
					useValue: {},
				},
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn().mockReturnValue('http://frontend'),
					},
				},
				{
					provide: UserIdentityService,
					useValue: {
						findEmailByAddress: jest.fn(),
						hashPassword: jest.fn(),
						findOrCreateEmail: jest.fn(),
						createVerificationCode: jest.fn(),
					},
				},
				{
					provide: UserMediaService,
					useValue: {},
				},
				{
					provide: MailerService,
					useValue: {
						sendMail: jest.fn(),
					},
				},
				{
					provide: LoggerService,
					useValue: {
						error: jest.fn(),
					},
				},
				{
					provide: SegmentsService,
					useValue: {
						getOrCreateSegmentByName: jest.fn().mockResolvedValue('segment-id'),
						addUserToSegment: jest.fn().mockResolvedValue(true),
					},
				},
				{
					provide: SignupEmailService,
					useValue: {
						sendSignupEmail: jest.fn().mockResolvedValue(undefined),
					},
				},
				{
					provide: getDataSourceToken(),
					useValue: {
						transaction: jest.fn(
							async (runInTransaction: (manager: EntityManager) => Promise<unknown>): Promise<unknown> =>
								runInTransaction(transactionManager),
						),
					},
				},
			],
		}).compile();

		service = module.get(AuthService);
		identityService = module.get(UserIdentityService);
		mailService = module.get(MailerService);
		usersService = module.get(UsersService);
	});

	it('should successfully register a user', async () => {
		identityService.findEmailByAddress.mockResolvedValue(null);
		identityService.hashPassword.mockResolvedValue('hashed');
		identityService.findOrCreateEmail.mockResolvedValue({
			id: 'email-id',
			email: 'test@mail.com',
			user: null,
			createdAt: new Date(),
		});
		identityService.createVerificationCode.mockResolvedValue({
			id: 'id',
			email: 'test@mail.com',
			code: '123456',
			createdAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60),
		});

		usersService.create.mockResolvedValue({
			id: 'user-id',
			first_name: 'John',
			last_name: 'Doe',
			date_created: new Date(),
			lead_magnet_slug: null,
		} as any);

		const result = await service.register({
			first_name: 'John',
			last_name: 'Doe',
			email: 'john@test.com',
			password: 'password',
			product_updates: false,
			marketing_emails: false,
		} as any);

		expect(result).toEqual({
			message: 'Registration successful. Please check your email for verification code.',
			userId: 'user-id',
		});

		expect(identityService.findEmailByAddress).toHaveBeenCalledWith('john@test.com');
		expect(identityService.createVerificationCode).toHaveBeenCalled();
		expect(mailService.sendMail).toHaveBeenCalled();
	});

	it('should throw ConflictException if email already exists', async () => {
		identityService.findEmailByAddress.mockResolvedValue({ id: 'email-id' } as any);

		await expect(
			service.register({
				email: 'exists@test.com',
				password: 'password',
			} as any),
		).rejects.toBeInstanceOf(ConflictException);
	});

	it('should add tracking data if provided', async () => {
		identityService.findEmailByAddress.mockResolvedValue(null);
		identityService.hashPassword.mockResolvedValue('hashed');
		identityService.findOrCreateEmail.mockResolvedValue({
			id: 'email-id',
			email: 'test@mail.com',
			user: null,
			createdAt: new Date(),
		});
		identityService.createVerificationCode.mockResolvedValue({
			id: 'id',
			email: 'test@mail.com',
			code: '123456',
			createdAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60),
		});

		usersService.create.mockResolvedValue({ id: 'user-id' } as any);

		await service.register({
			email: 'john@test.com',
			password: 'password',
			tracking: { utm_source: 'google' },
		} as any);

		expect(usersService.addTrackingData).toHaveBeenCalledWith('user-id', { utm_source: 'google' }, transactionManager);
	});
});
