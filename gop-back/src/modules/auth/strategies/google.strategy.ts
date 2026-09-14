import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../services/auth.service';
import { CONFIG } from '../../../config/enums';
import { AuthUser } from '../../../common/types';
import { User } from '../../users/entities/users.entity';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google-web') {
	constructor(
		private readonly configService: ConfigService,
		private readonly authService: AuthService,
	) {
		super({
			clientID: configService.get<string>(CONFIG.GOOGLE_CLIENT_ID),
			clientSecret: configService.get<string>(CONFIG.GOOGLE_CLIENT_SECRET),
			callbackURL: configService.get<string>(CONFIG.GOOGLE_CALLBACK_URL),
			scope: ['email', 'profile'],
		});
	}

	authorizationParams(): Record<string, string> {
		return { prompt: 'select_account' };
	}

	async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<AuthUser> {
		const email = profile?.emails?.[0]?.value;

		if (!email) {
			throw new UnauthorizedException('No email found in Google profile');
		}

		const user: User = await this.authService.validateGoogleUser({
			email,
			firstName: profile.name?.givenName,
			lastName: profile.name?.familyName,
		});

		return {
			userId: user.id,
			email: user.email,
		};
	}
}
