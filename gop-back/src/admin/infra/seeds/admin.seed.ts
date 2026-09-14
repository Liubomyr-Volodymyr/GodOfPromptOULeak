import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { AdminRole, Admins } from '../../entities/admins.entity';
import { ADMIN_HASH_SALT } from '../../common/constants/admin-hash-salt';
import { CONFIG_ADMIN } from '../../../config/enums';

@Injectable()
export class AdminSeeder implements OnApplicationBootstrap {
	private readonly logger = new Logger(AdminSeeder.name);

	constructor(
		@InjectRepository(Admins)
		private readonly repo: Repository<Admins>,
	) {}

	async onApplicationBootstrap() {
		await this.seed();
	}

	async seed() {
		const email = process.env[CONFIG_ADMIN.ADMIN_ROOT_EMAIL];
		const password = process.env[CONFIG_ADMIN.ADMIN_ROOT_PASSWORD];

		if (!email || !password) {
			this.logger.warn('Admin seed env variables are missing');
			return;
		}

		const existing = await this.repo.findOne({
			where: { email },
		});

		if (existing) {
			this.logger.log(`Admin "${email}" already exists. Skipping seed.`);
			return;
		}

		const passwordHash = await bcrypt.hash(password, ADMIN_HASH_SALT);

		await this.repo.save(
			this.repo.create({
				email,
				password: passwordHash,
				firstName: 'Admin',
				lastName: 'Admin',
				role: AdminRole.SUPERADMIN,
				isActive: true,
			}),
		);

		this.logger.log(`Admin "${email}" created successfully.`);
	}
}
