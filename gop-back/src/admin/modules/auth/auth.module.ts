import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthAdminController } from './auth.controller';
import { AuthAdminService } from './services/auth-admin.service';
import { CONFIG_ADMIN } from '../../../config/enums';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { AdminAuthRepository } from '../../infra/postgres/admin-auth.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admins } from '../../entities/admins.entity';

@Module({
	imports: [
		ConfigModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				secret: config.get<string>(CONFIG_ADMIN.ADMIN_JWT_SECRET),
				signOptions: {
					expiresIn: config.get<string>(CONFIG_ADMIN.ADMIN_JWT_EXPIRES_IN),
				},
			}),
		}),
		TypeOrmModule.forFeature([Admins]),
	],
	controllers: [AuthAdminController],
	providers: [AuthAdminService, AdminJwtStrategy, AdminAuthRepository],
})
export class AuthAdminModule {}
