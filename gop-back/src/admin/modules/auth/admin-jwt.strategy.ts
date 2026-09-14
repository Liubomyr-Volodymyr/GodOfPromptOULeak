import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CONFIG_ADMIN } from '../../../config/enums';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
	constructor(private readonly config: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: config.get(CONFIG_ADMIN.ADMIN_JWT_SECRET),
		});
	}

	async validate(payload: any) {
		return { id: payload.sub, email: payload.email, role: payload.role };
	}
}
