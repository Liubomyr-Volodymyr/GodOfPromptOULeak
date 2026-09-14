import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginAdminDto } from '../dto/login-admin.dto';
import { AdminAuthRepository } from '../../../infra/postgres/admin-auth.repository';

@Injectable()
export class AuthAdminService {
	constructor(
		private readonly repo: AdminAuthRepository,
		private readonly jwt: JwtService,
	) {}

	async validateCredentials(email: string, pass: string) {
		const admin = await this.repo.findByEmailWithPassword(email);
		console.log(admin);
		if (!admin) return null;

		const ok = admin.password ? await bcrypt.compare(pass, admin.password) : false;

		if (!ok || !admin.isActive) return null;

		return admin;
	}

	async login(credentials: LoginAdminDto) {
		const admin = await this.validateCredentials(credentials.email, credentials.password);

		if (!admin) {
			throw new UnauthorizedException('Invalid credentials');
		}

		return {
			access_token: this.jwt.sign({
				sub: admin.id,
				email: admin.email,
				role: admin.role,
			}),
		};
	}

	async getMe(adminId: number) {
		const admin = await this.repo.findById(adminId);

		if (!admin) {
			throw new UnauthorizedException('Admin not found');
		}

		return admin;
	}
}
