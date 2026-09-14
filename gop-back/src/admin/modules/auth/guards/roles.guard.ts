import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
		if (!required || required.length === 0) return true;

		const req = context.switchToHttp().getRequest();
		const user = req.user;
		if (!user) throw new UnauthorizedException();

		const userRoles = Array.isArray(user.role) ? user.role : user.role ? [user.role] : [];
		if (!userRoles || userRoles.length === 0) throw new ForbiddenException();

		const allowed = required.some((r) => userRoles.includes(r));
		if (!allowed) throw new ForbiddenException();
		return true;
	}
}
