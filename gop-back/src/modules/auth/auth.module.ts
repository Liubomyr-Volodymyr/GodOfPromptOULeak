import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { MailerModule } from '../../infra/mailer/mailer.module';
import { SegmentsModule } from '../segments/segments.module';
import { SignupEmailService } from './services/signup-email.service';
import { ActivityModule } from '../activity/activity.module';
import { Products } from '../user-products/entities/products.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([Products]),
		PassportModule.register({ defaultStrategy: 'jwt' }),
		JwtModule.register({
			secret: process.env.JWT_SECRET,
			signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
		}),
		MailerModule,
		UsersModule,
		ActivityModule,
		SegmentsModule,
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, GoogleStrategy, SignupEmailService],
	exports: [PassportModule, JwtModule],
})
export class AuthModule {}
