import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { EntityManager, Repository } from 'typeorm';
import { UsersVerificationService } from './users-verification.service';
import { User } from '../entities/users.entity';
import { USER_HASH_SALT } from '../../../common/constants';
import { UserEmails } from '../entities/user-emails.entity';
import { UserVerification } from '../entities/user-verification.entity';

@Injectable()
export class UserIdentityService {
	constructor(
		private readonly verificationService: UsersVerificationService,
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
		@InjectRepository(UserEmails)
		private readonly emailsRepo: Repository<UserEmails>,
	) {}

	async findByEmail(email: string): Promise<User> {
		const normalizedEmail = this.normalizeEmail(email);

		try {
			const user = await this.userRepo.findOne({
				where: { email: normalizedEmail },
			});

			if (!user) {
				throw new UnauthorizedException('User not found');
			}

			return user;
		} catch (err) {
			throw new UnauthorizedException(err.message);
		}
	}

	async findEmailByAddress(email: string): Promise<User | null> {
		const normalizedEmail = this.normalizeEmail(email);

		try {
			const user = await this.userRepo
				.createQueryBuilder('user')
				.leftJoinAndSelect('user.emails', 'email')
				.where('LOWER(user.email) = :email', { email: normalizedEmail })
				.orWhere('LOWER(email.email) = :email', { email: normalizedEmail })
				.getOne();

			return user ?? null;
		} catch (err) {
			throw new BadRequestException(err.message);
		}
	}

	async findOrCreateEmail(email: string, userId: string | null, verified: boolean, manager?: EntityManager): Promise<UserEmails> {
		const normalizedEmail = this.normalizeEmail(email);
		const emailsRepo: Repository<UserEmails> = manager ? manager.getRepository(UserEmails) : this.emailsRepo;
		const userRepo: Repository<User> = manager ? manager.getRepository(User) : this.userRepo;

		try {
			let existing = await emailsRepo.findOne({
				where: { email: normalizedEmail },
				relations: ['user'],
			});

			if (existing) {
				if (existing.user && userId && existing.user.id !== userId) {
					throw new BadRequestException('Email already assigned to another user');
				}

				if (!existing.user && userId) {
					const user = await userRepo.findOne({
						where: { id: userId },
					});

					if (!user) {
						throw new BadRequestException('User not found');
					}

					existing.user = user;
					return await emailsRepo.save(existing);
				}

				return existing;
			}

			let user: User | null = null;

			if (userId) {
				user = await userRepo.findOne({ where: { id: userId } });
				if (!user) {
					throw new BadRequestException('User not found');
				}
			}

			const entity = emailsRepo.create({
				email: normalizedEmail,
				user: user ?? null,
			});

			return await emailsRepo.save(entity);
		} catch (error: any) {
			if (error.code === '23505' && !manager) {
				const existing = await this.emailsRepo.findOne({
					where: { email: normalizedEmail },
					relations: ['user'],
				});

				if (existing) return existing;
			}

			throw new BadRequestException(error.message);
		}
	}

	async verifyPassword(raw: string, hash: string) {
		const isMatch = await bcrypt.compare(raw, hash);
		if (!isMatch) throw new UnauthorizedException('Invalid credentials');
	}

	async hashPassword(raw: string) {
		return bcrypt.hash(raw, USER_HASH_SALT);
	}

	async updatePassword(userId: string, oldPass: string, newPass: string) {
		try {
			const user = await this.userRepo.findOne({
				where: { id: userId },
			});

			if (!user?.password) {
				throw new BadRequestException('Password not set');
			}

			await this.verifyPassword(oldPass, user.password);

			const hashed = await this.hashPassword(newPass);

			await this.userRepo.update(userId, { password: hashed });
		} catch (err) {
			throw new BadRequestException(err.message);
		}
	}

	async resetPassword(userId: string, newPass: string) {
		try {
			const hashed = await this.hashPassword(newPass);
			await this.userRepo.update(userId, { password: hashed });
		} catch (err) {
			throw new BadRequestException(err.message);
		}
	}

	async createVerificationCode(email: string, manager?: EntityManager): Promise<UserVerification> {
		const normalizedEmail = this.normalizeEmail(email);

		try {
			const code: string = Math.floor(100000 + Math.random() * 900000).toString();
			const expiresAt: Date = new Date(Date.now() + 10 * 60 * 1000);

			await this.verificationService.deleteCodes(normalizedEmail, manager);

			return await this.verificationService.createVerificationRecord(
				{
					email: normalizedEmail,
					code,
					expires_at: expiresAt.toISOString(),
				},
				manager,
			);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	async verifyEmailCode(email: string, code: string) {
		const normalizedEmail = this.normalizeEmail(email);

		try {
			const user = await this.findEmailByAddress(normalizedEmail);

			if (!user) {
				throw new BadRequestException('Email not found');
			}

			await this.verificationService.findVerificationCode(normalizedEmail, code);

			await this.userRepo.update(user.id, {
				isVerified: true,
			});

			await this.verificationService.deleteCodes(normalizedEmail);
		} catch (err) {
			throw new BadRequestException(err.message);
		}
	}

	private normalizeEmail(email: string) {
		return email.toLowerCase().trim();
	}
}
