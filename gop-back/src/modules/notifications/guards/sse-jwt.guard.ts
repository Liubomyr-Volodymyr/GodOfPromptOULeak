import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { CONFIG } from '../../../config/enums';
import { AuthUser } from '../../../common/types';

@Injectable()
export class SseJwtGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	canActivate(context: ExecutionContext): boolean {
		const request: Request = context.switchToHttp().getRequest<Request>();
		const token: string | undefined = this.extractToken(request);

		if (!token) {
			throw new UnauthorizedException('Missing stream token');
		}

		try {
			const payload: AuthUser = this.jwtService.verify<AuthUser>(token, {
				secret: this.configService.get<string>(CONFIG.JWT_SECRET),
			});
			request.user = { userId: payload.userId, email: payload.email };
			return true;
		} catch {
			throw new UnauthorizedException('Invalid or expired stream token');
		}
	}

	private extractToken(request: Request): string | undefined {
		const queryToken: unknown = request.query.token;
		if (typeof queryToken === 'string' && queryToken.length > 0) {
			return queryToken;
		}

		const authHeader: string | undefined = request.headers.authorization;
		if (authHeader?.startsWith('Bearer ')) {
			return authHeader.slice(7);
		}

		return undefined;
	}
}
