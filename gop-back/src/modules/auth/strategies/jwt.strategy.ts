import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CONFIG } from '../../../config/enums';
import { AuthUser } from '../../../common/types';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly configService: ConfigService,
		private readonly authService: AuthService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: configService.get<string>(CONFIG.JWT_SECRET),
		});
	}

	async validate(payload: AuthUser): Promise<AuthUser> {
		if (!payload || !payload.userId) {
			throw new UnauthorizedException();
		}
		const user = await this.authService.validateUser(payload);
		if (user.currentStatus === 'blocked') {
			throw new ForbiddenException('Your account was blocked');
		}

		return { userId: payload.userId, email: payload.email };
	}
}
