import { BadGatewayException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Admins } from '../../../entities/admins.entity';
import { FindAllMembersDto } from '../../members/dto/find-all-members.dto';
import { PaginationItems } from '../../../common/dto/pagination.dto';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { ADMIN_HASH_SALT } from '../../../common/constants/admin-hash-salt';

@Injectable()
export class AdminsService {
	constructor(
		@InjectRepository(Admins)
		private readonly repo: Repository<Admins>,
	) {}

	async createAdmin(dto: CreateAdminDto): Promise<Admins> {
		try {
			const existing = await this.repo.findOne({
				where: { email: dto.email },
			});

			if (existing) {
				throw new HttpException('Admin with this email already exists', HttpStatus.CONFLICT);
			}

			const passwordHash = await bcrypt.hash(dto.password, ADMIN_HASH_SALT);

			const admin = this.repo.create({
				email: dto.email,
				role: dto.role,
				firstName: dto.first_name,
				lastName: dto.last_name,
				password: passwordHash,
				isActive: true,
			});

			return await this.repo.save(admin);
		} catch (err: any) {
			if (err instanceof HttpException) throw err;

			throw new BadGatewayException('Failed to create admin');
		}
	}

	async findAll(dto: FindAllMembersDto): Promise<PaginationItems<Admins>> {
		try {
			const { page, limit } = dto;
			const skip = (page - 1) * limit;

			const [items, total] = await this.repo
				.createQueryBuilder('admin')
				.select(['admin.id', 'admin.firstName', 'admin.lastName', 'admin.email', 'admin.avatarId', 'admin.role', 'admin.isActive'])
				.skip(skip)
				.take(limit)
				.getManyAndCount();

			return {
				items,
				meta: {
					total,
					page,
					limit,
					pageCount: Math.ceil(total / limit),
					hasNextPage: skip + limit < total,
				},
			};
		} catch (_e) {
			throw new HttpException('Failed to fetch admins', HttpStatus.BAD_GATEWAY);
		}
	}

	async deleteAdmin(id: number) {
		try {
			const admin = await this.repo.findOne({
				where: { id },
			});

			if (!admin) {
				throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
			}

			await this.repo.delete(id);

			return admin;
		} catch (e) {
			if (e instanceof HttpException) throw e;

			throw new BadGatewayException('Failed to delete admin');
		}
	}
}
