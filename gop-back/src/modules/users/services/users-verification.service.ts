import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, EntityManager } from 'typeorm';
import { User } from '../entities/users.entity';
import { UserVerification } from '../entities/user-verification.entity';

@Injectable()
export class UsersVerificationService {
	constructor(
		@InjectRepository(UserVerification)
		private readonly verificationRepo: Repository<UserVerification>,

		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
	) {}

	private resolveVerificationRepo(manager?: EntityManager): Repository<UserVerification> {
		return manager ? manager.getRepository(UserVerification) : this.verificationRepo;
	}

	async createVerificationRecord(
		data: { email: string; code: string; expires_at: string },
		manager?: EntityManager,
	): Promise<UserVerification> {
		const repo: Repository<UserVerification> = this.resolveVerificationRepo(manager);

		try {
			const entity: UserVerification = repo.create({
				email: data.email,
				code: data.code,
				expiresAt: new Date(data.expires_at),
			});

			return await repo.save(entity);
		} catch (error: any) {
			throw new InternalServerErrorException(`Failed to create verification code: ${error.message}`);
		}
	}

	async findVerificationCode(email: string, code: string): Promise<UserVerification> {
		try {
			const now = new Date();

			const record = await this.verificationRepo.findOne({
				where: {
					email,
					code,
					expiresAt: MoreThan(now),
				},
			});

			if (!record) {
				throw new UnauthorizedException('Verification code not found or expired');
			}

			return record;
		} catch (err: any) {
			if (err instanceof UnauthorizedException) throw err;

			throw new InternalServerErrorException(err.message);
		}
	}

	async markEmailAsVerified(email: string) {
		try {
			const user = await this.userRepo.findOne({
				where: { email },
			});

			if (!user) {
				throw new BadRequestException('User not found');
			}

			await this.userRepo.update(user.id, {
				isVerified: true,
			});
		} catch (err: any) {
			if (err instanceof BadRequestException) throw err;

			throw new InternalServerErrorException('Mark email as verified failed');
		}
	}

	async deleteCodes(email: string, manager?: EntityManager): Promise<void> {
		const repo: Repository<UserVerification> = this.resolveVerificationRepo(manager);

		try {
			const records: UserVerification[] = await repo.find({
				where: { email },
				select: ['id'],
			});

			if (!records.length) return;

			await repo.delete(records.map((record: UserVerification): string => record.id));
		} catch (error: any) {
			console.warn(`[deleteCodes] No codes deleted or error for email ${email}`, error?.message || error);
		}
	}
}
