import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class DevOnlyGuard implements CanActivate {
	canActivate(_context: ExecutionContext): boolean {
		if (process.env.NODE_ENV === 'production') {
			throw new ForbiddenException('Endpoint disabled in production');
		}
		return true;
	}
}
