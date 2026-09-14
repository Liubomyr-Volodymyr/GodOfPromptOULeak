import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IAuthRepository } from '../../domain/auth-repository.port';
import { Admins } from '../../entities/admins.entity';

@Injectable()
export class AdminAuthRepository implements IAuthRepository {
	constructor(
		@InjectRepository(Admins)
		private readonly repo: Repository<Admins>,
	) {}

	async findByEmailWithPassword(email: string) {
		try {
			return await this.repo
				.createQueryBuilder('admin')
				.addSelect('admin.password')
				.where('admin.email = :email', { email })
				.getOne();
		} catch (error) {
			throw new Error(`Failed to find admin by email: ${error.message}`);
		}
	}

	async findById(id: number) {
		try {
			return await this.repo.findOne({
				where: { id },
			});
		} catch (error) {
			throw new Error(`Failed to find admin by id: ${error.message}`);
		}
	}
}
